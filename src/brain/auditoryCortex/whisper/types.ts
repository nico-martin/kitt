export type WhisperOutput = string;
export type WhisperInput = {
  audio: Float32Array;
  language: string;
  maxNewTokens?: number;
};
export type WorkerResponseWhisper = WorkerResponse<WhisperOutput>;
export type WorkerRequestWhisper = WorkerRequest<WhisperInput>;

export interface WorkerRequest<Input> {
  input?: Input;
  id: number;
  log?: boolean;
}

export type InitPipelineProgressEvent = {
  status: "loading";
  id: number;
};

export type PipelineReadyEvent = {
  status: "ready";
  id: number;
};

export type TranscribeErrorEvent = {
  status: "error";
  error: any;
  id: number;
};

export type CompleteEvent<Output> = {
  status: "complete";
  output: Output;
  id: number;
};

export type WorkerResponse<Output = any> =
  | InitPipelineProgressEvent
  | PipelineReadyEvent
  | TranscribeErrorEvent
  | CompleteEvent<Output>;

export enum QueueStatus {
  ADDED_TO_QUEUE = "ADDED_TO_QUEUE",
  PENDING = "PENDING",
  ERROR = "ERROR",
  DONE = "DONE",
}

export interface QueueData {
  output?: WhisperOutput;
  status: QueueStatus;
  workerStatus?: WorkerResponseWhisper["status"];
  statusText: string;
}
