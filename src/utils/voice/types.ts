export enum VoiceStatus {
  IDLE = "idle",
  LOADING = "loading",
  READY = "ready",
  ERROR = "error",
}

export interface VoiceContextI {
  setup: () => void;
  status: VoiceStatus;
  isTalking: boolean;
  volume: number;
  talk: (text: string) => Promise<void>;
}
