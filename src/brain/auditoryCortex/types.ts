export interface AuditoryCortexFactory {
  initialize: (callback?: (progress: number) => void) => Promise<boolean>;
  start: () => void;
  stop: () => Promise<string>;
}

export interface Listener {
  start: () => void;
  end: () => Promise<string>;
}
