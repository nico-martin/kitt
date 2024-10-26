import React from "react";

import { CallbackData, context, LlmStatus } from "./llmContext.ts";
import { InitProgressCallback } from "@mlc-ai/web-llm/lib/types";
import Llm from "./Llm.ts";

const LlmContextProvider: React.FC<{
  children: React.ReactElement;
}> = ({ children }) => {
  const [status, setStatus] = React.useState<LlmStatus>(LlmStatus.IDLE);
  const llmInstance = React.useMemo(() => new Llm(), []);

  const messages = React.useSyncExternalStore(
    (cb) => llmInstance.onMessagesChanged(cb),
    () => llmInstance.messages
  );

  const workerBusy = React.useSyncExternalStore(
    (cb) => llmInstance.onWorkerBusyChanged(cb),
    () => llmInstance.workerBusy
  );

  const setup = async (
    callback: InitProgressCallback = () => {}
  ): Promise<void> => {
    console.log("Setting up LLM");
    setStatus(LlmStatus.LOADING);
    await llmInstance.initialize(callback);
    console.log("LLM setup complete");

    setStatus(LlmStatus.READY);
  };

  const generate = (
    prompt: string = "",
    callback: (data: CallbackData) => void = () => {}
  ) => llmInstance.generate(prompt, callback);

  return (
    <context.Provider
      value={{
        setup,
        generate,
        messages,
        status,
        busy: workerBusy,
      }}
    >
      {children}
    </context.Provider>
  );
};

export default LlmContextProvider;
