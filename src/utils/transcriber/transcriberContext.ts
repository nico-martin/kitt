import React from "react";

export enum TranscriberStatus {
  IDLE = "idle",
  LOADING = "loading",
  READY = "ready",
  ERROR = "error",
}

export interface TranscriberContext {
  setup: () => void;
  status: TranscriberStatus;
  isListening: boolean;
}

const transcriberContext = React.createContext<TranscriberContext>({
  setup: () => {},
  status: TranscriberStatus.IDLE,
  isListening: false,
});

export default transcriberContext;
