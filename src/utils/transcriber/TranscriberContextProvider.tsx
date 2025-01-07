import React from "react";
import transcriberContext, { TranscriberStatus } from "./transcriberContext.ts";
import Transcriber from "./Transcriber.ts";
import useLlm from "@utils/llm/useLlm.ts";
import useVoice from "@utils/voice/useVoice.ts";

const TranscriberContextProvider: React.FC<{
  children: React.ReactElement;
}> = ({ children }) => {
  const transcriber: Transcriber = React.useMemo(() => new Transcriber(), []);
  const [status, setStatus] = React.useState<TranscriberStatus>(
    TranscriberStatus.IDLE
  );
  const [isListening, setIsListening] = React.useState<boolean>(false);

  const { generate } = useLlm();
  const { talk } = useVoice();
  const setup = async () => {
    setStatus(TranscriberStatus.LOADING);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(
        (device) => device.kind === "audioinput"
      );
      await transcriber.setUpRecorder(audioDevices[0].deviceId);
      await transcriber.loadModel(/*(progress) => console.log(progress)*/);
      setStatus(TranscriberStatus.READY);
    } catch (e) {
      setStatus(TranscriberStatus.ERROR);
    }
  };

  React.useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.key === " ") {
        event.preventDefault();
        setIsListening(true);
        transcriber.startRecording();
      }
    };
    const keyup = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.key === " ") {
        event.preventDefault();
        setIsListening(false);
        transcriber.stopRecording().then(async (text) => {
          console.log(text);
          const response = await generate(text);
          console.log(response);
          await talk(response);
        });
      }
    };

    if (status === TranscriberStatus.READY) {
      document.addEventListener("keydown", keydown);
      document.addEventListener("keyup", keyup);
    }

    return () => {
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("keyup", keyup);
    };
  }, [status]);

  return (
    <transcriberContext.Provider value={{ status, setup, isListening }}>
      {children}
      <form
        style={{ backgroundColor: "#fff" }}
        onSubmit={async (e) => {
          e.preventDefault();
          const prompt = document.querySelector(
            "textarea[name=prompt]"
          ) as HTMLTextAreaElement;
          const response = await generate(prompt.value);
          console.log(response);
        }}
      >
        <textarea name="prompt"></textarea>
        <button type="submit">submit</button>
      </form>
    </transcriberContext.Provider>
  );
};

export default TranscriberContextProvider;
