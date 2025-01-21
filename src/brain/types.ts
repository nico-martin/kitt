import Brain from "./Brain.ts";

export enum BrainStatus {
  IDLE = "IDLE",
  WAKING_UP = "WAKING_UP",
  READY = "READY",
  LISTENING = "LISTENING",
  THINKING = "THINKING",
  SPEAKING = "SPEAKING",
}

export interface BrainContextI {
  status: BrainStatus;
  ready: boolean;
  brain: Brain;
}
