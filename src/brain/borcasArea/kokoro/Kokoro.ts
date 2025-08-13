import { ProgressInfo } from "@huggingface/transformers";

import { BorcasAreaFactory } from "../types";
import SequentialAudioPlayer from "./SequentialAudioPlayer";
import { EXPECTED_FILES } from "./constants";
import { KokoroInput, KokoroOutput, WorkerResponseKokoro } from "./types";

const WORKER_LOG = false;

class Kokoro extends EventTarget implements BorcasAreaFactory {
  private _volume = 0.2;

  private worker: Worker;
  private queue: Array<{ text: string; signal: AbortSignal }> = [];
  private isProcessing = false;
  public player = new SequentialAudioPlayer();
  private voice: string = "bm_daniel";
  private speed: number = 1.1;

  public get volume() {
    return this._volume;
  }

  private set volume(value) {
    this.dispatchEvent(new Event("volumeChange"));
    this._volume = value;
  }

  public onVolumeChange = (callback: (volume: number) => void) => {
    const listener = () => {
      callback(this.volume);
    };
    this.addEventListener("volumeChange", listener);
    return () => this.removeEventListener("volumeChange", listener);
  };

  constructor(options: { voice?: string; speed?: number } = {}) {
    super();
    this.worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
    if (options?.speed) {
      this.speed = options.speed;
    }
    if (options?.voice) {
      this.voice = options.voice;
    }
  }

  public async initialize(
    callback: (progress: number) => void = () => {}
  ): Promise<boolean> {
    const files: Record<
      string,
      {
        total: number;
        loaded: number;
      }
    > = Object.entries(EXPECTED_FILES).reduce(
      (acc, [file, total]) => ({
        ...acc,
        [file]: {
          total,
          loaded: 0,
        },
      }),
      {}
    );
    await this.workerMessage(
      {
        text: "",
        voice: this.voice,
        speed: this.speed,
      },
      (progress) => {
        if (progress.status === "progress") {
          files[progress.file] = {
            loaded: progress.loaded,
            total: progress.total,
          };
          const { total, loaded } = Object.values(files).reduce(
            (acc, progress) => ({
              total: acc.total + progress.total,
              loaded: acc.loaded + progress.loaded,
            }),
            { total: 0, loaded: 0 }
          );
          callback(Math.round((loaded / total) * 100));
        }
      }
    );
    return true;
  }

  public speak(text: string, signal?: AbortSignal): void {
    if (!text || text.trim() === "") return;
    if (signal?.aborted) return;

    this.queue.push({
      text: text.trim(),
      signal: signal || new AbortController().signal,
    });

    if (!this.isProcessing) {
      this.processNext();
    }
  }

  private processNext(): void {
    this.queue = this.queue.filter((item) => !item.signal.aborted);

    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const item = this.queue.shift()!;

    this.processAndPlay(item.text, item.signal)
      .then(() => {
        // Process next item in queue
        this.processNext();
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          this.processNext();
          return;
        }
        console.error("Error processing TTS:", error);
        this.processNext();
      });
  }

  private async processAndPlay(
    text: string,
    signal: AbortSignal
  ): Promise<void> {
    if (signal.aborted) {
      throw new DOMException("Operation aborted", "AbortError");
    }

    const audioBlob = await this.workerMessage(
      {
        text,
        voice: this.voice,
        speed: this.speed,
      },
      () => {},
      signal
    );

    if (signal.aborted) {
      throw new DOMException("Operation aborted", "AbortError");
    }
    this.player.play(audioBlob, signal);
  }

  private workerMessage(
    input: KokoroInput,
    loadingCallback: (progress: ProgressInfo) => void = () => {},
    signal?: AbortSignal
  ): Promise<KokoroOutput> {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36);

      const abortListener = () => {
        this.worker.removeEventListener("message", listener);
        reject(new DOMException("Operation aborted", "AbortError"));
      };

      if (signal && signal.aborted) {
        reject(new DOMException("Operation aborted", "AbortError"));
        return;
      }

      signal &&
        signal.addEventListener("abort", abortListener, {
          once: true,
        });

      this.worker.postMessage({ input, id, log: WORKER_LOG });

      const listener = (e: MessageEvent<WorkerResponseKokoro>) => {
        if (e.data.id !== id) return;
        if (e.data.status === "loading") {
          loadingCallback(e.data.progress);
          return;
        }

        if (e.data.status === "complete") {
          this.worker.removeEventListener("message", listener);
          signal && signal.removeEventListener("abort", abortListener);
          resolve(e.data.output);
        }

        if (e.data.status === "error") {
          this.worker.removeEventListener("message", listener);
          signal && signal.removeEventListener("abort", abortListener);
          reject(e.data);
        }
      };

      this.worker.addEventListener("message", listener);
    });
  }
}

export default Kokoro;
