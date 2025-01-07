import React from "react";
import { VoiceContextI, VoiceStatus } from "./types.ts";

const VoiceContext = React.createContext<VoiceContextI>({
  setup: () => {},
  status: VoiceStatus.IDLE,
  isTalking: false,
  volume: 0,
  talk: async () => {},
});

export default VoiceContext;
