import splitBySentence from "@utils/formatters/splitBySentence.ts";

import { BorcasAreaFactory } from "../types.ts";
import {
  KokoroInput,
  KokoroOutput,
  QueueData,
  QueueStatus,
  WorkerResponseKokoro,
} from "./types.ts";

const WORKER_LOG = false;

// todo: add volume change

class Kokoro extends EventTarget implements BorcasAreaFactory {
  private _volume = 1;
  private worker: Worker;
  private logger: (data: any) => any;
  private queue: Array<{ id: number; input: KokoroInput }> = [];
  private queueInProgress: boolean = false;
  private id: number = 0;

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
    return () => {
      this.removeEventListener("volumeChange", listener);
    };
  };

  constructor(logCallback: (data: any) => any = () => {}) {
    super();

    this.worker = new Worker(new URL("./kokoroWorker.ts", import.meta.url), {
      type: "module",
    });

    if (logCallback) {
      this.logger = logCallback;
    }
  }

  private workerMessage = (
    id: string,
    input: KokoroInput,
    onMessage: (e: WorkerResponseKokoro) => void = () => {}
  ): Promise<KokoroOutput> =>
    new Promise((resolve, reject) => {
      this.worker.postMessage({ input, id, log: WORKER_LOG });
      const listener = (e: MessageEvent<WorkerResponseKokoro>) => {
        if (e.data.id !== id) return;
        if (e.data.status === "complete") {
          this.worker.removeEventListener("message", listener);
          resolve(e.data.output);
        }
        if (e.data.status === "error") {
          this.worker.removeEventListener("message", listener);
          reject(e.data);
        }
        onMessage(e.data);
      };

      this.worker.addEventListener("message", listener);
    });

  private playAudioBlob = async (blob: Blob): Promise<void> =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.addEventListener("ended", () => {
        URL.revokeObjectURL(url);
        resolve();
      });
      audio.addEventListener("error", (error) => {
        URL.revokeObjectURL(url);
        reject(error);
      });
      audio.play();
    });

  private executeQueue = async () => {
    if (this.queue.length === 0) {
      this.logger("Queue is empty");
      return;
    }

    if (this.queueInProgress) {
      this.logger("Queue in progress");
      return;
    }

    this.queueInProgress = true;
    const activeElement = this.queue.shift();
    this.dispatchQueueUpdate(activeElement.id, {
      status: QueueStatus.PENDING,
      statusText: "Pending...",
    });
    const parts = splitBySentence(activeElement.input.text);

    const processAndPlayAll = (parts: Array<string>): Promise<void> =>
      new Promise((resolve, reject) => {
        try {
          const audios: Array<Blob> = new Array(parts.length).fill(null);
          let isPlaying = false;

          const maybePlayNext = async () => {
            const nextPlayIndex = audios.findIndex(Boolean);
            if (audios[nextPlayIndex] && !isPlaying) {
              isPlaying = true;
              await this.playAudioBlob(audios[nextPlayIndex]);
              audios[nextPlayIndex] = null;
              isPlaying = false;
              if (nextPlayIndex === audios.length - 1) {
                resolve();
              } else {
                maybePlayNext();
              }
            }
          };

          const processAudios = async () => {
            let i = 0;
            for (const part of parts) {
              audios[i] = await this.workerMessage(`${activeElement.id}-${i}`, {
                ...activeElement.input,
                text: part,
              });
              maybePlayNext();
              i++;
            }
          };

          processAudios();
        } catch (e) {
          reject(e);
        }
      });

    return processAndPlayAll(parts)
      .then(() => {
        this.dispatchQueueUpdate(activeElement.id, {
          status: QueueStatus.DONE,
          statusText: "done",
        });
      })
      .catch((e) => {
        this.dispatchQueueUpdate(activeElement.id, {
          status: QueueStatus.ERROR,
          statusText: JSON.stringify(e),
        });
        this.logger(e);
      })
      .finally(() => {
        this.queueInProgress = false;
        this.executeQueue();
      });
  };

  private dispatchQueueUpdate = (id: number, data: QueueData) =>
    this.dispatchEvent(new CustomEvent(`queue-update-${id}`, { detail: data }));

  private onQueueUpdate = (
    id: number,
    cb: (data: QueueData) => void
  ): (() => void) => {
    const listener = (evt: CustomEvent<QueueData>) => cb(evt.detail);
    this.addEventListener(`queue-update-${id}`, listener as EventListener);
    return () =>
      this.removeEventListener(`queue-update-${id}`, listener as EventListener);
  };

  public initialize = async (cb) => {
    cb(1);
    return true;
  };

  public speak = async (
    text: string,
    callback: (data: any) => void = () => {}
  ): Promise<void> =>
    new Promise((resolve, reject) => {
      this.id++;
      const id = this.id;
      this.queue.push({ id, input: { text, voice: "bm_lewis" } });
      callback({
        status: QueueStatus.ADDED_TO_QUEUE,
        statusText:
          this.queue.length === 1 && !this.queueInProgress
            ? "Queue empty. Lets go."
            : `Added to queue at position ${this.queue.length}`,
      });
      const removeQueueListener = this.onQueueUpdate(id, (data) => {
        callback(data);
        if (
          data.status === QueueStatus.DONE ||
          data.status === QueueStatus.ERROR
        ) {
          removeQueueListener();
          if (data.status === QueueStatus.DONE) {
            resolve();
          } else {
            reject(data);
          }
        }
      });
      this.executeQueue();
    });
}

export default Kokoro;
