import React from "react";

import { LlmContext } from "./LlmContext.ts";
import { LlmFactoryI, LlmStatus } from "./types.ts";
import webLlmGemma2_9b from "./webllm/webLlmGemma2_9b.ts";

const LlmContextProvider: React.FC<{
  children: React.ReactElement;
}> = ({ children }) => {
  const [status, setStatus] = React.useState<LlmStatus>(LlmStatus.IDLE);
  const llmFactory: LlmFactoryI = webLlmGemma2_9b;

  const setup = async (cb: (progress: number) => void = () => {}) => {
    setStatus(LlmStatus.LOADING);
    await llmFactory.initialize(cb);
    setStatus(LlmStatus.READY);
  };

  const createConversation = (systemPrompt: string) =>
    llmFactory.createConversation(systemPrompt);

  return (
    <LlmContext
      value={{
        status,
        setup,
        createConversation,
      }}
    >
      {children}
    </LlmContext>
  );
};

export default LlmContextProvider;
