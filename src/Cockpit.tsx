import { BrainStatus } from "@brain/types.ts";
import useBrain from "@brain/useBrain.ts";
import { Button, Display, Kitt, TextLoader } from "@theme";
import React from "react";

import ConnectCar from "@app/ConnectCar.tsx";
import Listener from "@app/Listener.tsx";
import ManageEpisodesModal from "@app/manageEpisodes/ManageEpisodesModal.tsx";
import SettingsModal from "@app/settings/SettingsModal.tsx";

import cn from "@utils/classnames.ts";

import styles from "./Cockpit.module.css";

const Cockpit: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { status: brainStatus, ready: brainReady, brain } = useBrain();
  const [manageEpisodesModal, setManageEpisodesModal] =
    React.useState<boolean>(false);
  const [settingsModal, setSettingsModal] = React.useState<boolean>(false);
  const [auditoryCortexProgress, setAuditoryCortexProgress] =
    React.useState<number>(0);
  const [borcasAreaProgress, setBorcasAreaProgress] = React.useState<number>(0);
  const [llmProgress, setLlmProgress] = React.useState<number>(0);
  const [audioDevices, setAudioDevices] = React.useState<
    Array<MediaDeviceInfo>
  >([]);

  const setupAudioDevices = async () => {
    await navigator.mediaDevices.getUserMedia({ audio: true });

    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices = devices.filter(
      (device) => device.kind === "audioinput"
    );
    setAudioDevices(audioDevices);
  };

  React.useEffect(() => {
    setupAudioDevices();
  }, []);

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
          <Button disabled={true} onClick={() => {}} color="yellow">
            Stop!
          </Button>
        </div>
        <Display className={styles.display} messages={messages} />
        <div className={styles.right}>
          {settingsModal && (
            <SettingsModal
              show={settingsModal}
              setShow={setSettingsModal}
              audioDevices={audioDevices}
            />
          )}
          <Button
            color="yellow"
            disabled={audioDevices.length === 0}
            onClick={() => setSettingsModal(true)}
          >
            Settings
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
              //const query = window.prompt("Enter your query:");

              /*console.log("RERANKER");
              const compareWith = "Who wrote 'To Kill a Mockingbird'?";
              const texts = [
                "'To Kill a Mockingbird' is a novel by Harper Lee published in 1960. It was immediately successful, winning the Pulitzer Prize, and has become a classic of modern American literature.",
                "The novel 'Moby-Dick' was written by Herman Melville and first published in 1851. It is considered a masterpiece of American literature and deals with complex themes of obsession, revenge, and the conflict between good and evil.",
                "Harper Lee, an American novelist widely known for her novel 'To Kill a Mockingbird', was born in 1926 in Monroeville, Alabama. She received the Pulitzer Prize for Fiction in 1961.",
                "Jane Austen was an English novelist known primarily for her six major novels, which interpret, critique and comment upon the British landed gentry at the end of the 18th century.",
                "The 'Harry Potter' series, which consists of seven fantasy novels written by British author J.K. Rowling, is among the most popular and critically acclaimed books of the modern era.",
                "'The Great Gatsby', a novel written by American author F. Scott Fitzgerald, was published in 1925. The story is set in the Jazz Age and follows the life of millionaire Jay Gatsby and his pursuit of Daisy Buchanan.",
              ];
              console.log("COMPARE", compareWith);
              console.log("TEXTS", texts);
              reranker
                .rerank({
                  compareWith,
                  texts,
                })
                .then((out) =>
                  console.log(
                    "OUTPUT",
                    out.map((o) => o.text)
                  )
                );
              return;*/

              const query =
                "Do you remember in season 1 when Michael fell asleep in the car and got pulled over by the police? What was your suggestion on how he should handle it?";
              //"Hi KITT, Do you remember in season 1 when Michael fell asleep in the car and got pulled over by the police? What was your suggestion?";
              //"How did Michael avoid trouble when he fell asleep in the car and got pulled over by the police?";

              console.log(query);
              await brain.processQuery(query);
              //const scenes = await brain.hippocampus.getMemory(query, 1);
              //console.log(scenes.map((s) => s.entry.summaries));
              /*
              scenes.map(({ entry, similarityScore }) => {
                console.log(similarityScore);
                console.log(entry.episodeId);
                console.log((entry?.summaries || []).join("\n---\n"));
              });*/
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
          Wake up!
        </Button>
      )}
    </div>
  );
};

export default Cockpit;
