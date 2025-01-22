export type FeatureExtractionOutput = Array<Array<number>>;
export type FeatureExtractionInput = Array<string>;
export type WorkerResponseFeatureExtraction =
  WorkerResponse<FeatureExtractionOutput>;
export type WorkerRequestFeatureExtraction =
  WorkerRequest<FeatureExtractionInput>;

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
  output?: FeatureExtractionOutput;
  status: QueueStatus;
  workerStatus?: WorkerResponseFeatureExtraction["status"];
  statusText: string;
}

export interface FeatureExtractionFactory {
  generate: (texts: FeatureExtractionInput) => Promise<Array<Array<number>>>;
}
