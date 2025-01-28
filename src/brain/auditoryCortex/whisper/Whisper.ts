import WHISPER_LANGUAGES from "@brain/auditoryCortex/whisper/languages.ts";

import getSetting from "@utils/settings/getSetting.ts";

import { AuditoryCortexFactory } from "../types.ts";
import getAudioFromChunks from "./getAudioFromChunks.ts";
import {
  QueueData,
  QueueStatus,
  WhisperInput,
  WhisperOutput,
  WorkerResponseWhisper,
} from "./types.ts";

const WORKER_LOG = false;

class Whisper extends EventTarget implements AuditoryCortexFactory {
  private worker: Worker;
  private logger: (data: any) => any;
  private queue: Array<{ id: number; input: WhisperInput }> = [];
  private queueInProgress: boolean = false;
  private id: number = 0;
  private audioContext: AudioContext;
  private chunks: Array<Blob> = [];
  private recorder: MediaRecorder;
  private stream: MediaStream;
  public recording: boolean = false;
  private cutAudioAt: number = 0;

  constructor(logCallback: (data: any) => any = () => {}) {
    super();

    this.worker = new Worker(new URL("./whisperWorker.ts", import.meta.url), {
      type: "module",
    });

    if (logCallback) {
      this.logger = logCallback;
    }
  }

  private workerMessage = (
    id: number,
    input: WhisperInput,
    onMessage: (e: WorkerResponseWhisper) => void
  ): Promise<WhisperOutput> =>
    new Promise((resolve, reject) => {
      this.worker.postMessage({ input, id, log: WORKER_LOG });
      const listener = (e: MessageEvent<WorkerResponseWhisper>) => {
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

    try {
      const output = await this.workerMessage(
        activeElement.id,
        activeElement.input,
        (workerData) =>
          this.dispatchQueueUpdate(activeElement.id, {
            status: QueueStatus.PENDING,
            statusText: "Pending...",
            workerStatus: workerData.status,
          })
      );
      this.dispatchQueueUpdate(activeElement.id, {
        status: QueueStatus.DONE,
        statusText: "done",
        output,
      });
    } catch (e) {
      this.dispatchQueueUpdate(activeElement.id, {
        status: QueueStatus.ERROR,
        statusText: JSON.stringify(e),
      });
      this.logger(e);
    }
    this.queueInProgress = false;
    this.executeQueue();
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

  private transcribe = async (
    input: WhisperInput,
    callback: (data: QueueData) => void = () => {}
  ): Promise<WhisperOutput> =>
    new Promise((resolve, reject) => {
      this.id++;
      const id = this.id;
      this.queue.push({ id, input });
      callback({
        status: QueueStatus.ADDED_TO_QUEUE,
        statusText: `Added to queue at position ${this.queue.length}`,
      });
      this.executeQueue();
      const removeQueueListener = this.onQueueUpdate(id, (data) => {
        callback(data);
        if (
          data.status === QueueStatus.DONE ||
          data.status === QueueStatus.ERROR
        ) {
          removeQueueListener();
          if (data.status === QueueStatus.DONE) {
            resolve(data.output);
          } else {
            reject(data);
          }
        }
      });
    });

  public destroyAudio = () => {
    this.stream && this.stream.getAudioTracks().map((track) => track.stop());
    this.recorder && this.recorder.stop();
    this.recorder = null;
  };

  public initialize = async (cb) => {
    this.recorder && this.destroyAudio();

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: getSetting("audioInputDeviceId")
        ? { deviceId: getSetting("audioInputDeviceId") }
        : true,
    });

    console.log("stream", { deviceId: getSetting("audioInputDeviceId") });

    this.recorder = new MediaRecorder(this.stream);
    this.audioContext = new AudioContext({ sampleRate: 16000 });

    this.recorder.onstart = () => {
      this.recording = true;
      this.recorder.requestData();
    };

    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
      } else {
        setTimeout(() => this.recorder.requestData(), 25);
      }
    };

    this.recorder.onstop = () => {
      this.recording = false;
    };
    cb(1);
    return true;
  };

  private stopRecording = (): Promise<Array<Blob>> =>
    new Promise((resolve) => {
      const listener = () => resolve(this.chunks);
      this.recorder.addEventListener("stop", listener);
      this.recorder.stop();
      window.setTimeout(() => {
        this.recorder.removeEventListener("stop", listener);
      }, 1000);
    });

  public start = () => {
    this.recorder.start();
  };

  public stop = async () => {
    const chunks = await this.stopRecording();
    const audio = await getAudioFromChunks(
      chunks,
      this.recorder.mimeType,
      this.audioContext
    );
    const languageSetting = getSetting("speechToTextLanguage");
    const language =
      WHISPER_LANGUAGES.find((l) => l.value === languageSetting)?.value || "en";
    const output = await this.transcribe({
      audio:
        audio.length > this.cutAudioAt ? audio.slice(this.cutAudioAt) : audio,
      language,
    });
    this.cutAudioAt = audio.length;
    return output.trim();
  };
}

export default Whisper;
