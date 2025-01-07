import React from "react";

import { LlmStatus } from "../llm/llmContext.ts";
import useLlm from "../llm/useLlm.ts";
import { TranscriberStatus } from "../transcriber/types.ts";
import useTranscriber from "../transcriber/useTranscriber.ts";
import { VoiceStatus } from "../voice/types.ts";
import useVoice from "../voice/useVoice.ts";
import BrainContext from "./BrainContext.ts";
import { BrainStatus } from "./types.ts";

const BrainContextProvider: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const [status, setStatus] = React.useState<BrainStatus>(BrainStatus.IDLE);
  const { status: transcriberStatus, createListener } = useTranscriber();
  const { talk, status: voiceStatus } = useVoice();
  const { status: llmStatus } = useLlm();

  const ready =
    transcriberStatus === TranscriberStatus.READY &&
    voiceStatus === VoiceStatus.READY &&
    llmStatus === LlmStatus.READY;

  React.useEffect(() => {
    if (!ready) return;
    let isSpacePressed = false;
    const listener = createListener();

    const keydown = (event: KeyboardEvent) => {
      if (
        (event.code === "Space" || event.key === " ") &&
        !isSpacePressed &&
        (event.target as HTMLTextAreaElement)?.type !== "textarea"
      ) {
        event.preventDefault();
        setStatus(BrainStatus.LISTENING);
        listener.start();
        isSpacePressed = true;
      }
    };
    const keyup = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.key === " ") {
        event.preventDefault();
        isSpacePressed = false;
        setStatus(BrainStatus.THINKING);
        listener.end().then(async (text) => {
          setStatus(BrainStatus.SPEAKING);
          await talk(text);
          setStatus(BrainStatus.READY);
        });
      }
    };

    document.addEventListener("keydown", keydown);
    document.addEventListener("keyup", keyup);

    return () => {
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("keyup", keyup);
    };
  }, [ready]);

  return <BrainContext value={{ status }}>{children}</BrainContext>;
};

export default BrainContextProvider;
