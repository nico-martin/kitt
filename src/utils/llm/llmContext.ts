import React from "react";

import { InitProgressCallback } from "@mlc-ai/web-llm/lib/types";
import { CompletionUsage } from "@mlc-ai/web-llm/lib/openai_api_protocols/chat_completion";
import { CompletionMessage } from "./types.ts";

export enum LlmStatus {
  IDLE = "idle",
  LOADING = "loading",
  READY = "ready",
  ERROR = "error",
}

export interface CallbackData {
  output: string;
  stats?: CompletionUsage;
}

export interface Context {
  setup: (callback?: InitProgressCallback) => Promise<void>;
  generate: (prompt: string, callback?: (data: CallbackData) => void) => void;
  messages: Array<CompletionMessage>;
  status: LlmStatus;
  busy: boolean;
}

export const context = React.createContext<Context>({
  setup: async () => {},
  generate: async () => "",
  messages: [],
  status: LlmStatus.IDLE,
  busy: false,
});
