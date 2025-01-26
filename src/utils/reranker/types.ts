export type RerankerOutput = Array<{
  corpus_id: number;
  score: number;
  text: string;
}>;
export type RerankerInput = {
  texts: Array<string>;
  compareWith: string;
};
export type WorkerResponseReranker = WorkerResponse<RerankerOutput>;
export type WorkerRequestReranker = WorkerRequest<RerankerInput>;

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
  output?: RerankerOutput;
  status: QueueStatus;
  workerStatus?: WorkerResponseReranker["status"];
  statusText: string;
}

export interface FeatureExtractionFactory {
  generate: (texts: RerankerInput) => Promise<Array<Array<number>>>;
}
