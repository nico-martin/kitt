import { BrainStatus } from "@brain/types.ts";
import useBrain from "@brain/useBrain.ts";
import { Button, Display, Kitt, TextLoader } from "@theme";
import React from "react";

import ConnectCar from "@app/ConnectCar.tsx";
import Listener from "@app/Listener.tsx";
import ManageEpisodesModal from "@app/manageEpisodes/ManageEpisodesModal.tsx";

import cn from "@utils/classnames.ts";

import styles from "./Cockpit.module.css";

const Cockpit: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { status: brainStatus, ready: brainReady, brain } = useBrain();
  const [manageEpisodesModal, setManageEpisodesModal] =
    React.useState<boolean>(false);
  const [auditoryCortexProgress, setAuditoryCortexProgress] =
    React.useState<number>(0);
  const [borcasAreaProgress, setBorcasAreaProgress] = React.useState<number>(0);
  const [llmProgress, setLlmProgress] = React.useState<number>(0);

  const [messages, setMessages] = React.useState<
    Array<string | React.ReactElement>
  >(["Hi there! Ready to start?"]);

  React.useEffect(() => {
    setMessages(
      brainStatus === BrainStatus.IDLE
        ? ["Hi there! Ready to start?"]
        : [
            ...(llmProgress >= 1
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
            ...(auditoryCortexProgress >= 1
              ? [
                  <React.Fragment>
                    <TextLoader done /> ears ready
                  </React.Fragment>,
                ]
              : [
                  <React.Fragment>
                    <TextLoader /> warming up ears -{" "}
                    {Math.round(auditoryCortexProgress * 100)}%
                  </React.Fragment>,
                ]),
            ...(borcasAreaProgress >= 1
              ? [
                  <React.Fragment>
                    <TextLoader done /> voice ready
                  </React.Fragment>,
                ]
              : [
                  <React.Fragment>
                    <TextLoader /> preparing voice -{" "}
                    {Math.round(borcasAreaProgress * 100)}%
                  </React.Fragment>,
                ]),
          ]
    );
  }, [brain.status, auditoryCortexProgress, borcasAreaProgress]);

  return (
    <div className={cn(className, styles.root)}>
      <div className={styles.top}>
        <div className={styles.left}>
          <ConnectCar disabled={!brainReady} />
          <Listener disabled={!brainReady} />
          <Button
            disabled={false}
            onClick={() => {
              brain.borcasArea
                .speak("Hello World. This is a Test. Lets see if this works.")
                .then(() => console.log("Test"));
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
          {manageEpisodesModal && (
            <ManageEpisodesModal
              show={manageEpisodesModal}
              setShow={setManageEpisodesModal}
            />
          )}
          <Button color="yellow" onClick={() => setManageEpisodesModal(true)}>
            Memories
          </Button>
          <Button
            color="yellow"
            onClick={async () => {
              const query =
                "Hi KITT, Do you remember how Michael avoided trouble when he fell asleep in the car and got pulled over by the police?";
              //"How did Michael avoid trouble when he fell asleep in the car and got pulled over by the police?";

              console.log(query);
              const scenes = await brain.hippocampus.getMemory(query);

              scenes.map(({ entry, similarityScore }) => {
                console.log(similarityScore);
                console.log(entry.episodeId);
                console.log((entry?.summaries || []).join("\n---\n"));
              });
            }}
          >
            search
          </Button>
        </div>
      </div>
      {brainReady ? (
        <Kitt className={styles.kitt} volume={0.5} />
      ) : (
        <Button
          className={styles.startButton}
          onClick={async () =>
            await brain.wakeUp(
              (progress) => setAuditoryCortexProgress(progress),
              (progress) => setBorcasAreaProgress(progress),
              (progress) => setLlmProgress(progress)
            )
          }
        >
          Start!
        </Button>
      )}
    </div>
  );
};

export default Cockpit;
