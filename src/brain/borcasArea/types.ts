export interface BorcasAreaFactory {
  initialize: (callback?: (progress: number) => void) => Promise<boolean>;
  speak: (text: string) => Promise<void>;
  volume: number;
  onVolumeChange: (callback: (volume: number) => void) => () => void;
}
