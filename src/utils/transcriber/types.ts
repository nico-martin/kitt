export enum TranscriberStatus {
  IDLE = "idle",
  LOADING = "loading",
  READY = "ready",
  ERROR = "error",
}

export interface Listener {
  start: () => void;
  end: () => Promise<string>;
}

export interface TranscriberContextI {
  status: TranscriberStatus;
  setup: () => void;
  createListener: () => Listener;
}
