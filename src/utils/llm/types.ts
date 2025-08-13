export enum LlmStatus {
  IDLE = "idle",
  LOADING = "loading",
  READY = "ready",
  ERROR = "error",
}

export interface GenerateReturn {
  output: string;
  stats?: {
    outputTokens: number;
    inputTokens: number;
  };
}

export type GenerateFn = (
  prompt: string,
  callback?: (answer: GenerateReturn) => void
) => Promise<GenerateReturn>;

type CreateConversation = (
  systemPrompt: string,
  temperature?: number
) => Promise<{
  generate: GenerateFn;
}>;

export interface LlmContextI {
  status: LlmStatus;
  setup: (callback?: (progress: number) => void) => Promise<void>;
  createConversation: CreateConversation;
}

export interface LlmFactoryI {
  initialize: (callback?: (progress: number) => void) => Promise<boolean>;
  createConversation: CreateConversation;
}
