export enum LlmStatus {
  IDLE = "idle",
  LOADING = "loading",
  READY = "ready",
  ERROR = "error",
}

type CreateConversation = (systemPrompt: string) => {
  generate: (
    input: string,
    callback?: (partialAnswer: string) => void
  ) => Promise<string>;
};

export interface LlmContextI {
  status: LlmStatus;
  setup: (callback?: (progress: number) => void) => Promise<void>;
  createConversation: CreateConversation;
}

export interface LlmFactoryI {
  initialize: (callback?: (progress: number) => void) => Promise<boolean>;
  createConversation: CreateConversation;
}
