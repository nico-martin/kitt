import BasalGanglia from "@brain/basalGanglia/BasalGanglia.ts";
import { BasalGangliaFactory } from "@brain/basalGanglia/types.ts";

import SpeechToText from "./auditoryCortex/SpeechToText.ts";
import { AuditoryCortexFactory, Listener } from "./auditoryCortex/types.ts";
import SpeechSynthesis from "./borcasArea/SpeechSynthesis.ts";
import { BorcasAreaFactory } from "./borcasArea/types.ts";
import Hippocampus from "./hippocampus/Hippocampus.ts";
import { HippocampusFactory } from "./hippocampus/types.ts";
import { BrainStatus } from "./types.ts";

class Brain extends EventTarget {
  private _status: BrainStatus = BrainStatus.IDLE;
  public auditoryCortex: AuditoryCortexFactory = new SpeechToText();
  public borcasArea: BorcasAreaFactory = new SpeechSynthesis();
  public hippocampus: HippocampusFactory = new Hippocampus();
  public basalGanglia: BasalGangliaFactory = new BasalGanglia();

  public constructor() {
    super();
    this.basalGanglia.addFunction(this.hippocampus.memoryAgentFunction);
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
          this.status = BrainStatus.SPEAKING;
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
