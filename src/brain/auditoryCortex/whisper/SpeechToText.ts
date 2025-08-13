import getSetting from "@utils/settings/getSetting.ts";

import { AuditoryCortexFactory } from "../types.ts";
import { EXPECTED_FILES } from "./constants";
import getAudioFromChunks from "./getAudioFromChunks.ts";
import { SpeechToTextWorkerMessage, SpeechToTextWorkerResponse } from "./types";

class SpeechToText implements AuditoryCortexFactory {
  private worker: Worker;
  private id: number = 0;
  private chunks: Array<Blob> = [];
  private recorder: MediaRecorder;
  private stream: MediaStream;
  public recording: boolean = false;
  private audioContext: AudioContext;
  private cutAudioAt: number = 0;

  constructor() {
    this.worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
  }

  public initialize(
    callback: (progress: number) => void = () => {}
  ): Promise<boolean> {
    return new Promise(async (resolve) => {
      this.recorder && this.destroyAudio();

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: getSetting("audioInputDeviceId")
          ? { deviceId: getSetting("audioInputDeviceId") }
          : true,
      });

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

      // Send a small dummy audio buffer to initialize the model
      const dummyAudio = new Float32Array(16000); // 1 second of silence at 16kHz
      this.generate(dummyAudio, 16000, callback)
        .then(() => resolve(true))
        .catch(() => {
          // Ignore errors during preload - this is just to initialize the model
        });
    });
  }

  public destroyAudio = () => {
    this.stream && this.stream.getAudioTracks().map((track) => track.stop());
    this.recorder && this.recorder.stop();
    this.recorder = null;
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
    const output = await this.generate(
      audio.length > this.cutAudioAt ? audio.slice(this.cutAudioAt) : audio
    );
    this.cutAudioAt = audio.length;
    return output.trim();
  };

  public async generate(
    audioData: Float32Array,
    sampleRate: number = 16000,
    progressCallback: (progress: number) => void = () => {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const id = (this.id++).toString();

      const files: Record<string, { total: number; loaded: number }> =
        Object.entries(EXPECTED_FILES).reduce(
          (acc, [file, total]) => ({
            ...acc,
            [file]: {
              total,
              loaded: 0,
            },
          }),
          {}
        );

      const listener = (e: MessageEvent<SpeechToTextWorkerResponse>) => {
        if (e.data.id !== id) return;

        if (e.data.status === "progress") {
          if (e.data.progress.status === "progress") {
            files[e.data.progress.file] = {
              loaded: e.data.progress.loaded,
              total: e.data.progress.total,
            };
            const { total, loaded } = Object.entries(files).reduce(
              (acc, [, progress]) => ({
                total: acc.total + progress.total,
                loaded: acc.loaded + progress.loaded,
              }),
              { total: 0, loaded: 0 }
            );
            progressCallback(Math.round((loaded / total) * 100));
          }
        }

        if (e.data.status === "complete") {
          this.worker.removeEventListener("message", listener);
          resolve(e.data.text || "");
        }

        if (e.data.status === "error") {
          this.worker.removeEventListener("message", listener);
          reject(new Error(e.data.error || "Speech to text failed"));
        }
      };

      this.worker.addEventListener("message", listener);

      this.worker.postMessage(
        {
          id,
          audioData,
          sampleRate,
        } as SpeechToTextWorkerMessage,
        [audioData.buffer]
      );
    });
  }

  public async generateFromBlob(audioBlob: Blob): Promise<string> {
    const audioData = await this.processAudioBlob(audioBlob);
    return this.generate(audioData.data, audioData.sampleRate);
  }

  private async processAudioBlob(
    blob: Blob
  ): Promise<{ data: Float32Array; sampleRate: number }> {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    let audioData = audioBuffer.getChannelData(0);
    if (audioBuffer.sampleRate !== 16000) {
      audioData = this.resampleAudio(audioData, audioBuffer.sampleRate, 16000);
    }

    return {
      data: audioData,
      sampleRate: 16000,
    };
  }

  private resampleAudio(
    audioData: Float32Array,
    originalSampleRate: number,
    targetSampleRate: number
  ): Float32Array {
    const ratio = originalSampleRate / targetSampleRate;
    const newLength = Math.round(audioData.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const originalIndex = i * ratio;
      const leftIndex = Math.floor(originalIndex);
      const rightIndex = Math.ceil(originalIndex);
      const fraction = originalIndex - leftIndex;

      if (rightIndex < audioData.length) {
        result[i] =
          audioData[leftIndex] * (1 - fraction) +
          audioData[rightIndex] * fraction;
      } else {
        result[i] = audioData[leftIndex];
      }
    }

    return result;
  }
}

export default SpeechToText;
