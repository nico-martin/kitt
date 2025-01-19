import React from "react";

import SpeechSynthesis from "./SpeechSynthesis.ts";
import VoiceContext from "./VoiceContext.ts";
import { VoiceStatus } from "./types.ts";

// todo: maybe https://huggingface.co/posts/Xenova/503648859052804

const VoiceContextProvider: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const speechSynthesis = React.useMemo(() => new SpeechSynthesis(), []);
  const [status, setStatus] = React.useState<VoiceStatus>(VoiceStatus.IDLE);
  const [isTalking, setIsTalking] = React.useState<boolean>(false);

  const volume = React.useSyncExternalStore(
    (cb) => speechSynthesis.onVolumeChanged(cb),
    () => speechSynthesis.volume
  );

  const setup = async () => {
    setStatus(VoiceStatus.LOADING);
    try {
      await speechSynthesis.setup();
      console.log("Voice setup complete");
      setStatus(VoiceStatus.READY);
    } catch (e) {
      setStatus(VoiceStatus.ERROR);
    }
  };

  const talk = async (text: string) => {
    setIsTalking(true);
    await speechSynthesis.speak(text);
    setIsTalking(false);
  };

  return (
    <VoiceContext value={{ status, setup, volume, isTalking, talk }}>
      {children}
    </VoiceContext>
  );
};

export default VoiceContextProvider;
