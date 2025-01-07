class SpeechSynthesis extends EventTarget {
  private _volume = 1;
  private language = "en-US";
  //private recorder: MediaRecorder;

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
    const audioElement = new Audio();
    audioElement.style.display = "none"; // Hidden audio element
    document.body.appendChild(audioElement);
  }

  public calculateVolume = () => {
    // random number between 0.2 and 1
    this.volume = Math.random() * 0.8 + 0.2;
  };

  public setup = async () => {
    /*
    const devices = await navigator.mediaDevices.enumerateDevices();
    const outputDevice = devices.find(
      (device) => device.kind === "audiooutput"
    );
    if (!outputDevice) {
      throw new Error("No output device found");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: outputDevice.deviceId },
    });

    this.recorder = new MediaRecorder(stream);
    this.recorder.onstart = () => {
      this.volume = 0.1;
    };
    this.recorder.onstop = () => {
      this.volume = 0.1;
    };
    this.recorder.ondataavailable = async (event) => {
      // todo: I dont think that works at all..
      const arrayBuffer = await event.data.arrayBuffer();
      const dataArray = new Uint8Array(arrayBuffer);
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 32;
      const bufferLength = analyser.frequencyBinCount;
      const frequencyData = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(frequencyData);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const vol = sum / dataArray.length;

      if (!isNaN(vol)) {
        const minVol = 125;
        const maxVol = 131;
        const percentage = (vol - minVol) / (maxVol - minVol);
        this.volume = percentage < 0 ? 0 : percentage > 1 ? 1 : percentage;
      }
    };*/
  };

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
