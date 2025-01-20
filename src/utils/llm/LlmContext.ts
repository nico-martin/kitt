import React from "react";

import { LlmContextI, LlmStatus } from "./types.ts";

export const LlmContext = React.createContext<LlmContextI>({
  status: LlmStatus.IDLE,
  setup: async () => {},
  createConversation: () => ({ generate: async () => ({ output: "" }) }),
});
