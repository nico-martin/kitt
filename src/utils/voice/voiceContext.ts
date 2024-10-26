import React from "react";

export enum VoiceStatus {
  IDLE = "idle",
  LOADING = "loading",
  READY = "ready",
  ERROR = "error",
}

export interface VoiceContext {
  setup: () => void;
  status: VoiceStatus;
  isTalking: boolean;
  volume: number;
  talk: (text: string) => Promise<void>;
}

const voiceContext = React.createContext<VoiceContext>({
  setup: () => {},
  status: VoiceStatus.IDLE,
  isTalking: false,
  volume: 0,
  talk: async () => {},
});

export default voiceContext;
