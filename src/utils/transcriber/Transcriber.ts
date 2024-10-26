import {
  FileLoadingCallbackData,
  PipelineStatus,
  WorkerResponse,
} from "./types.ts";
import { v4 as uuidv4 } from "uuid";
import getAudioFromChunks from "./utils/getAudioFromChunks.ts";

class Transcriber extends EventTarget {
  private worker: Worker;
  private audioContext: AudioContext;
  private recorder: MediaRecorder;
  private stream: MediaStream;
  private recorderReady: boolean = false;
  private modelReady: boolean = false;
  private recording: boolean = false;
  private modelBusy: boolean = false;
  private language: string = "en";

  constructor() {
    super();
    if (!navigator.mediaDevices.getUserMedia) {
      throw "getUserMedia not supported on your browser!";
    }

    this.worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
  }

  get ready() {
    return Boolean(this.modelReady && this.audioContext && this.recorder);
  }

  public setUpRecorder = async (audioDeviceId: string) => {
    if (!this.recorderReady) await this.setUpAudio(audioDeviceId);
  };

  private setUpAudio = async (
    audioDeviceId: string,
    sampleRate: number = 16000
  ) => {
    this.recorder && this.destroyAudio();

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: audioDeviceId },
    });

    this.recorder = new MediaRecorder(this.stream);
    this.audioContext = new AudioContext({ sampleRate });
    let chunks: Array<Blob> = [];

    this.recorder.onstart = () => {
      this.recording = true;
      chunks = [];
      this.recorder.requestData();
    };

    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      } else {
        setTimeout(() => this.recorder.requestData(), 25);
      }
    };

    this.recorder.onstop = () => {
      this.processChunks(chunks).then((output) => {
        this.dispatchEvent(
          new CustomEvent<string>("generated", { detail: output })
        );
      });
      this.recording = false;
    };

    this.recorderReady = true;
  };

  public destroyAudio = () => {
    this.stream && this.stream.getAudioTracks().map((track) => track.stop());
    this.recorder && this.recorder.stop();
    this.recorder = null;
  };

  private processChunks = async (chunks: Array<Blob>) => {
    if (this.modelBusy) return;
    if (chunks.length === 0) return;

    const audio = await getAudioFromChunks(
      chunks,
      this.recorder.mimeType,
      this.audioContext
    );

    return await this.generate(audio);
  };

  private generate = async (
    audio: Float32Array = null,
    progressCallback: (data: WorkerResponse) => void = () => {}
  ): Promise<string> =>
    new Promise((resolve, reject) => {
      this.modelBusy = true;
      const requestId = uuidv4();
      const listener = (e: MessageEvent<WorkerResponse>) => {
        if (e.data.id !== requestId) return;
        progressCallback && progressCallback(e.data);
        if (e.data.status === "complete") {
          this.worker.removeEventListener("message", listener);
          this.modelBusy = false;
          resolve(e.data.text);
        }
        if (e.data.status === "error") {
          this.worker.removeEventListener("message", listener);
          this.modelBusy = false;
          reject(e.data);
        }
      };
      this.worker.addEventListener("message", listener);
      this.worker.postMessage({
        id: requestId,
        audio,
        language: this.language,
      });
    });

  public startRecording = () => {
    if (!this.recorderReady) {
      throw new Error("Recorder not ready. Please call setUpRecorder() first.");
    }
    if (!this.modelReady) {
      throw new Error("Model not ready. Please call loadModel() first.");
    }
    if (this.recording) return;
    this.recorder.start();
  };

  public stopRecording = (): Promise<string> =>
    new Promise((resolve) => {
      if (!this.recording) {
        throw new Error("Recording not yet started.");
      }
      this.recorder.stop();
      this.addEventListener("generated", (e) => {
        resolve((e as CustomEvent<string>).detail);
      });
    });

  public loadModel = async (
    callback: (data: {
      status: PipelineStatus;
      files: Array<FileLoadingCallbackData>;
    }) => void = () => {}
  ): Promise<void> => {
    let files: Array<FileLoadingCallbackData> = [];
    await this.generate(null, (data) => {
      if (data.status === PipelineStatus.DOWNLOAD) {
        files = files.find((f) => f.name === data.file.name)
          ? files.map((f) => (f.name === data.file.name ? data.file : f))
          : [...files, data.file];
        callback({
          status: data.status,
          files,
        });
      }
      if (data.status === PipelineStatus.READY) this.modelReady = true;
      callback({ status: data.status, files });
    });
  };
}

export default Transcriber;
