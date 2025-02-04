import {
  SpeechToTextProvider,
  TextToSpeechProvider,
} from "@utils/settings/constants.ts";
import getSetting from "@utils/settings/getSetting.ts";

import SpeechToText from "./auditoryCortex/SpeechToText.ts";
import { AuditoryCortexFactory, Listener } from "./auditoryCortex/types.ts";
import Whisper from "./auditoryCortex/whisper/Whisper.ts";
import BasalGanglia from "./basalGanglia/BasalGanglia.ts";
import { BasalGangliaFactory } from "./basalGanglia/types.ts";
import SpeechSynthesis from "./borcasArea/SpeechSynthesis.ts";
import Kokoro from "./borcasArea/kokoro/Kokoro.ts";
import { BorcasAreaFactory } from "./borcasArea/types.ts";
import Hippocampus from "./hippocampus/Hippocampus.ts";
import { HippocampusFactory } from "./hippocampus/types.ts";
import MotorCortex from "./motorCortex/MotorCortex.ts";
import { BrainStatus } from "./types.ts";

class Brain extends EventTarget {
  private _status: BrainStatus = BrainStatus.IDLE;
  public auditoryCortex: AuditoryCortexFactory =
    getSetting("speechToTextProvider") === SpeechToTextProvider.WHISPER
      ? new Whisper()
      : new SpeechToText();
  public borcasArea: BorcasAreaFactory =
    getSetting("textToSpeechProvider") === TextToSpeechProvider.KOKORO
      ? new Kokoro()
      : new SpeechSynthesis();
  public hippocampus: HippocampusFactory = new Hippocampus();
  public basalGanglia: BasalGangliaFactory = new BasalGanglia();
  public motorCortext: MotorCortex = new MotorCortex();

  public constructor() {
    super();
    this.basalGanglia.addFunction(this.hippocampus.memoryAgentFunction);
    this.basalGanglia.addFunction(this.motorCortext.changeDirectionFunction);
    this.basalGanglia.addFunction(this.motorCortext.changeSpeedFunction);
  }

  public get status(): BrainStatus {
    return this._status;
  }

  public set status(value: BrainStatus) {
    this._status = value;
    this.dispatchEvent(new Event("statusChange"));
  }

  public onStatusChange = (callback: (status: BrainStatus) => void) => {
    const listener = () => {
      callback(this.status);
    };
    this.addEventListener("statusChange", listener);
    return () => {
      this.removeEventListener("statusChange", listener);
    };
  };

  public wakeUp = async (
    auditoryCortexCallback: (progress: number) => void,
    borcasAreaCallback: (progress: number) => void,
    llmCallback: (progress: number) => void
  ) => {
    this.status = BrainStatus.WAKING_UP;
    await Promise.all([
      this.auditoryCortex.initialize(auditoryCortexCallback),
      this.borcasArea.initialize(borcasAreaCallback),
      this.basalGanglia.llm.initialize(llmCallback),
    ]);
    this.status = BrainStatus.READY;
  };

  private createListener = (): Listener => {
    let started = false;
    return {
      start: () => {
        started = true;
        this.auditoryCortex.start();
      },
      end: async (): Promise<string> => {
        if (!started) return;
        started = false;
        return await this.auditoryCortex.stop();
      },
    };
  };

  public registerListeners = () => {
    if (this.status !== BrainStatus.READY) {
      throw new Error("Brain is still sleeping");
    }
    let isSpacePressed = false;
    const listener = this.createListener();

    const keydown = (event: KeyboardEvent) => {
      if (
        (event.code === "Space" || event.key === " ") &&
        !isSpacePressed &&
        (event.target as HTMLTextAreaElement)?.type !== "textarea"
      ) {
        event.preventDefault();
        this.status = BrainStatus.LISTENING;
        listener.start();
        isSpacePressed = true;
      }
    };
    const keyup = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.key === " ") {
        event.preventDefault();
        isSpacePressed = false;
        this.status = BrainStatus.THINKING;
        listener.end().then(async (text) => {
          if (!text) {
            this.status = BrainStatus.READY;
            return;
          }
          text = text.replace(/kid/gi, "KITT");
          this.status = BrainStatus.SPEAKING;
          this.triggerStartSpeak(text);
          const response = await this.basalGanglia.evaluateNextStep(text);
          await this.borcasArea.speak(response);
          this.status = BrainStatus.READY;
        });
      }
    };

    document.addEventListener("keydown", keydown);
    document.addEventListener("keyup", keyup);

    return () => {
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("keyup", keyup);
    };
  };

  public triggerStartSpeak = async (text: string, delay: number = 2000) => {
    const startsWithHi =
      text.toLowerCase().startsWith("hi") ||
      text.toLowerCase().startsWith("hello") ||
      text.toLowerCase().startsWith("hey");
    const isQuestion = text.endsWith("?");

    const thinkingResponses = [
      "Interesting take. Let me think about it for a second.",
      "That's a great point. Give me a second to gather my thoughts.",
      "Hmm, I hadn’t considered that before. Let me think it through.",
      "Interesting perspective! Let me process that for a moment.",
      "I like where you're going with this. Let me reflect on it for a sec.",
      "That’s a complex one. Let me take a moment to articulate my response.",
      "Oh, that’s a fresh angle! Let me wrap my head around it.",
      "You just gave me something to really chew on. Give me a second.",
      "That’s worth a careful response. Let me organize my thoughts.",
      "Great insight! I need a moment to consider all the angles.",
      "That's an unexpected viewpoint. Let me think it over.",
      "You’ve got me curious! Let me take a second to process.",
      "That’s a tricky one. I need a moment to piece things together.",
      "I want to give this the thought it deserves. Hold on a sec.",
      "You’re making me think! Give me a moment to unpack this.",
      "That’s a deep one. Let me sit with it for a second.",
      "I see where you're coming from. Let me mull this over.",
      "Wow, that’s something to think about! Let me reflect for a moment.",
      "You just sparked an idea—let me put it into words.",
    ];

    const questionResponses = [
      "Great question, let me think about it.",
      "That’s an interesting question! Give me a second to gather my thoughts.",
      "Hmm, I need to think this one through for a moment.",
      "That’s a tough one! Let me take a second to process.",
      "Good question! I want to give you a thoughtful answer, so let me think.",
      "Wow, that’s something to consider. Let me reflect on it for a sec.",
      "That’s a deep one! Give me a moment to wrap my head around it.",
      "Oh, I love this question! Let me organize my thoughts before I answer.",
      "You really got me thinking! Give me a moment to articulate my response.",
      "That’s a tricky one. Let me take a second to figure out my take on it.",
      "Hmm, I haven't thought about that before. Let me process it.",
      "That’s a fascinating angle! Let me consider all the possibilities.",
      "I want to do this question justice. Let me reflect on it for a moment.",
      "That’s a good one—I need a moment to come up with a solid answer.",
      "I appreciate this question! Let me take a second to think it over.",
      "This requires some thought. Give me a moment to work it out.",
      "You’ve raised a great point! Let me take a beat to think about it.",
      "That’s a nuanced question. Let me take a second to break it down.",
      "I need to give this some proper thought. Let me think for a second.",
      "You just made me pause! Let me put my thoughts together.",
    ];

    const operatorName = getSetting("operatorName") || "there";
    const talk =
      (startsWithHi ? `Hi ${operatorName}! ` : "") +
      (isQuestion
        ? questionResponses[
            Math.floor(Math.random() * questionResponses.length)
          ]
        : thinkingResponses[
            Math.floor(Math.random() * thinkingResponses.length)
          ]);

    await new Promise((resolve) => setTimeout(resolve, delay));
    return this.borcasArea.speak(talk);
  };

  public processQuery = async (query: string) => {
    if (this.status === BrainStatus.IDLE) {
      await this.wakeUp(
        () => {},
        () => {},
        () => {}
      );
    }

    const response = await this.basalGanglia.evaluateNextStep(query);
    console.log(response);
  };
}

export default Brain;
