import React from "react";
import styles from "./Cockpit.module.css";
import cn from "@utils/classnames.ts";
import { Button, Display, Kitt, TextLoader } from "@theme";

import ConnectCar from "@app/ConnectCar.tsx";
import Listener from "@app/Listener.tsx";
import useTranscriber from "@utils/transcriber/useTranscriber.ts";
import { TranscriberStatus } from "@utils/transcriber/transcriberContext.ts";
import useVoice from "@utils/voice/useVoice.ts";
import { VoiceStatus } from "@utils/voice/voiceContext.ts";
import useLlm from "@utils/llm/useLlm.ts";
import { LlmStatus } from "@utils/llm/llmContext.ts";

const Cockpit: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { status: transcriberStatus, setup: setupTranscriber } =
    useTranscriber();
  const { talk, status: voiceStatus, setup: setupVoice, volume } = useVoice();
  const { status: llmStatus, setup: setupLlm } = useLlm();
  const [llmProgress, setLlmProgress] = React.useState<number>(0);

  const [messages, setMessages] = React.useState<
    Array<string | React.ReactElement>
  >(["Hi there! Ready to start?"]);

  const isReady =
    transcriberStatus === TranscriberStatus.READY &&
    voiceStatus === VoiceStatus.READY &&
    llmStatus === LlmStatus.READY;

  React.useEffect(() => {
    const idle =
      transcriberStatus === TranscriberStatus.IDLE &&
      voiceStatus === VoiceStatus.IDLE &&
      llmStatus === LlmStatus.IDLE;
    setMessages(
      idle
        ? ["Hi there! Ready to start?"]
        : [
            ...(llmStatus === LlmStatus.READY
              ? [
                  <React.Fragment>
                    <TextLoader done /> brain ready
                  </React.Fragment>,
                ]
              : [
                  <React.Fragment>
                    <TextLoader /> waking up the brain -{" "}
                    {Math.round(llmProgress * 100)}%
                  </React.Fragment>,
                ]),
            ...(transcriberStatus === TranscriberStatus.READY
              ? [
                  <React.Fragment>
                    <TextLoader done /> ears ready
                  </React.Fragment>,
                ]
              : [
                  <React.Fragment>
                    <TextLoader /> warming up ears
                  </React.Fragment>,
                ]),
            ...(voiceStatus === VoiceStatus.READY
              ? [
                  <React.Fragment>
                    <TextLoader done /> voice ready
                  </React.Fragment>,
                ]
              : [
                  <React.Fragment>
                    <TextLoader /> preparing voice
                  </React.Fragment>,
                ]),
          ]
    );
  }, [transcriberStatus, voiceStatus, llmStatus, llmProgress]);

  return (
    <div className={cn(className, styles.root)}>
      <div className={styles.top}>
        <div className={styles.left}>
          <ConnectCar disabled={!isReady} />
          <Listener disabled={!isReady} />
          <Button
            disabled={false}
            onClick={() => {
              talk("Hello World. This is a Test. Lets see if this works.").then(
                () => console.log("Test")
              );
            }}
            color="yellow"
          >
            Stop!
          </Button>
        </div>
        <Display className={styles.display} messages={messages} />
        <div className={styles.right}>
          <Button color="yellow" disabled>
            Camera
          </Button>
          <Button color="yellow" disabled />
          <Button color="yellow" disabled />
        </div>
      </div>
      {isReady ? (
        <Kitt className={styles.kitt} volume={volume} />
      ) : (
        <Button
          className={styles.startButton}
          onClick={async () =>
            await Promise.all([
              setupLlm((d) => setLlmProgress(d.progress)),
              setupTranscriber(),
              setupVoice(),
            ])
          }
        >
          Start!
        </Button>
      )}
    </div>
  );
};

export default Cockpit;
