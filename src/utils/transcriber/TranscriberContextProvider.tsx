import React from "react";
import transcriberContext, { TranscriberStatus } from "./transcriberContext.ts";
import Transcriber from "./Transcriber.ts";

const TranscriberContextProvider: React.FC<{
  children: React.ReactElement;
}> = ({ children }) => {
  const transcriber: Transcriber = React.useMemo(() => new Transcriber(), []);
  const [status, setStatus] = React.useState<TranscriberStatus>(
    TranscriberStatus.IDLE
  );
  const [isListening, setIsListening] = React.useState<boolean>(false);

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
        transcriber.stopRecording().then((text) => console.log(text));
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
    </transcriberContext.Provider>
  );
};

export default TranscriberContextProvider;
