export enum PipelineStatus {
  IDLE = "idle",
  DOWNLOAD = "download",
  READY = "ready",
  COMPLETE = "complete",
  ERROR = "error",
}

export interface WorkerRequest {
  language?: string;
  maxNewTokens?: number;
  audio?: Float32Array;
  id: string;
  log?: boolean;
}

interface FileLoadingCallbackDataNormal {
  file: string;
  name: string;
  status: "initiate" | "progress" | "download" | "done";
}

interface FileLoadingCallbackDataProgress {
  file: string;
  name: string;
  status: "progress";
  progress?: number;
  loaded?: number;
  total?: number;
}

export type FileLoadingCallbackData =
  | FileLoadingCallbackDataNormal
  | FileLoadingCallbackDataProgress;

export type InitPipelineProgressEvent = {
  status: PipelineStatus.DOWNLOAD;
  file: FileLoadingCallbackData;
  id: string;
};

export type PipelineReadyEvent = {
  status: PipelineStatus.READY;
  id: string;
};

export type TranscribeErrorEvent = {
  status: PipelineStatus.ERROR;
  error: any;
  id: string;
};

export type CompleteEvent = {
  status: PipelineStatus.COMPLETE;
  text: string;
  id: string;
};

export type WorkerResponse =
  | InitPipelineProgressEvent
  | PipelineReadyEvent
  | TranscribeErrorEvent
  | CompleteEvent;
