export interface InitializeCallbackData {
  progress: number;
  timeElapsed: number;
  text: string;
}

export interface GenerateCallbackStats {
  completion_tokens: number;
  prompt_tokens: number;
  total_tokens: number;
  extra: {
    e2e_latency_s: number;
    prefill_tokens_per_s: number;
    decode_tokens_per_s: number;
    time_to_first_token_s: number;
    time_per_output_token_s: number;
  };
}

export enum GenerateCallbackStatus {
  ADDED_TO_QUEUE = "ADDED_TO_QUEUE",
  THINKING = "THINKING",
  UPDATE = "UPDATE",
  DONE = "DONE",
  ERROR = "ERROR",
}

export interface GenerateCallbackData {
  output: string;
  stats?: GenerateCallbackStats;
  status: GenerateCallbackStatus;
  statusText: string;
  modelId: string;
}
