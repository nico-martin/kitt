class SpeechSynthesis extends EventTarget {
  private _volume = 1;
  private language = "en-US";

  public get volume() {
    return this._volume;
  }

  public set volume(value) {
    this.dispatchEvent(new Event("volumeChange"));
    this._volume = value;
  }

  public onVolumeChanged = (callback: (volume: number) => void) => {
    const listener = () => callback(this.volume);
    this.addEventListener("volumeChange", listener);
    return () => this.removeEventListener("volumeChange", listener);
  };

  public constructor() {
    super();
  }

  public calculateVolume = () => {
    // random number between 0.2 and 1
    this.volume = Math.random() * 0.8 + 0.2;
  };

  public setup = async () => {};

  public speak = (text: string, language = this.language): Promise<void> =>
    new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      const voices = speechSynthesis
        .getVoices()
        .filter((voice) => voice.lang === language);
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
