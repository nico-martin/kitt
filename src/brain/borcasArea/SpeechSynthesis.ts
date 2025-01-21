import { BorcasAreaFactory } from "./types.ts";

class SpeechSynthesis extends EventTarget implements BorcasAreaFactory {
  private _volume = 1;
  private language = "en-US";

  public get volume() {
    return this._volume;
  }

  public set volume(value) {
    this.dispatchEvent(new Event("volumeChange"));
    this._volume = value;
  }

  public onVolumeChange = (callback: (volume: number) => void) => {
    const listener = () => {
      callback(this.volume);
    };
    this.addEventListener("volumeChange", listener);
    return () => {
      this.removeEventListener("volumeChange", listener);
    };
  };

  public constructor() {
    super();
  }

  public calculateVolume = () => {
    // random number between 0.2 and 1
    this.volume = Math.random() * 0.8 + 0.2;
  };

  public initialize = async (cb) => {
    cb(1);
    return true;
  };

  public speak = (text: string): Promise<void> =>
    new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.language;
      const voices = speechSynthesis
        .getVoices()
        .filter((voice) => voice.lang === this.language);
      utterance.voice = voices[0];

      utterance.onstart = () => {
        const intervalId = setInterval(() => {
          this.calculateVolume();
        }, 100);

        utterance.onend = () => {
          clearInterval(intervalId);
          this.volume = 0.1;
          resolve();
        };
      };

      speechSynthesis.speak(utterance);
    });
}

export default SpeechSynthesis;
