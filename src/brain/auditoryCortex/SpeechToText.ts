import { LANGUAGES } from "@utils/settings/constants.ts";
import getSetting from "@utils/settings/getSetting.ts";

import { AuditoryCortexFactory } from "./types.ts";

class SpeechToText implements AuditoryCortexFactory {
  private recognition: SpeechRecognition;

  public start = () => {
    if (this.recognition) {
      throw new Error("Already started");
    }
    this.recognition = new webkitSpeechRecognition();
    const languageSetting = getSetting("speechToTextLanguage");
    this.recognition.lang =
      LANGUAGES.find((l) => l.lang === languageSetting)?.locale || "en-US";
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 5;
    this.recognition.start();
  };

  public initialize = async (cb) => {
    cb(1);
    return true;
  };

  public stop = () =>
    new Promise<string>((resolve) => {
      if (!this.recognition) {
        throw new Error("Not started");
      }
      this.recognition.onresult = (event) => {
        resolve(event.results[0][0].transcript);
      };
      this.recognition.stop();
      this.recognition = null;
    });
}

export default SpeechToText;
