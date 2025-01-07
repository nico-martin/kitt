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
    setStatus(LlmStatus.LOADING);
    await llmInstance.initialize(callback);
    setStatus(LlmStatus.READY);
  };

  const generate = async (
    prompt: string = "",
    callback: (data: CallbackData) => void = () => {}
  ) => await llmInstance.generate(prompt, callback);

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
