export enum BrainStatus {
  IDLE = "IDLE",
  READY = "READY",
  LISTENING = "LISTENING",
  THINKING = "THINKING",
  SPEAKING = "SPEAKING",
}

export interface BrainContextI {
  status: BrainStatus;
}
