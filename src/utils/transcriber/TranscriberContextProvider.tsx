import React from "react";

import SpeechToText from "./SpeechToText.ts";
import TranscriberContext from "./TranscriberContext.ts";
import { Listener, TranscriberStatus } from "./types.ts";

const TranscriberContextProvider: React.FC<{
  children: React.ReactElement;
}> = ({ children }) => {
  const [status, setStatus] = React.useState<TranscriberStatus>(
    TranscriberStatus.IDLE
  );

  const setup = async () => {
    setStatus(TranscriberStatus.LOADING);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setStatus(TranscriberStatus.READY);
    } catch (e) {
      setStatus(TranscriberStatus.ERROR);
    }
  };

  const createListener = (): Listener => {
    const speechToText = new SpeechToText();
    let started = false;

    return {
      start: () => {
        if (status !== TranscriberStatus.READY) return;
        started = true;
        speechToText.start();
      },
      end: async (): Promise<string> => {
        if (!started) return;
        started = false;
        return await speechToText.stop();
      },
    };
  };

  return (
    <TranscriberContext value={{ status, setup, createListener }}>
      {children}
    </TranscriberContext>
  );
};

export default TranscriberContextProvider;
