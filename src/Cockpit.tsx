import { Button, Display, Kitt, TextLoader } from "@theme";
import React from "react";

import ConnectCar from "@app/ConnectCar.tsx";
import Listener from "@app/Listener.tsx";
//import Log from "@app/log/Log.tsx";
import AgentLog from "@app/agentLog/AgentLog.tsx";
import ManageEpisodesModal from "@app/manageEpisodes/ManageEpisodesModal.tsx";
import SettingsModal from "@app/settings/SettingsModal.tsx";

import cn from "@utils/classnames.ts";

import { MotorCortexStatus } from "@brain/motorCortex/types.ts";
import { BrainStatus } from "@brain/types.ts";
import useBrain from "@brain/useBrain.ts";

import styles from "./Cockpit.module.css";

const Cockpit: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { status: brainStatus, ready: brainReady, brain } = useBrain();
  const [manageEpisodesModal, setManageEpisodesModal] =
    React.useState<boolean>(false);
  const [reloading, setReloading] = React.useState<boolean>(false);
  const [settingsModal, setSettingsModal] = React.useState<boolean>(false);
  const [auditoryCortexProgress, setAuditoryCortexProgress] =
    React.useState<number>(0);
  const [borcasAreaProgress, setBorcasAreaProgress] = React.useState<number>(0);
  const [llmProgress, setLlmProgress] = React.useState<number>(0);
  const [audioDevices, setAudioDevices] = React.useState<
    Array<MediaDeviceInfo>
  >([]);
  const motorCortexStatus: MotorCortexStatus = React.useSyncExternalStore(
    (cb) => brain.motorCortext.onStatusChange(cb),
    () => brain.motorCortext.status
  );
  const [logOpen, setLogOpen] = React.useState<boolean>(false);
  const volume: number = React.useSyncExternalStore(
    (cb) => brain.borcasArea.onVolumeChange(cb),
    () => brain.borcasArea.volume
  );

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
    const interval = setInterval(() => {}, 2000);
    return () => clearInterval(interval);
  }, []);

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
            <React.Fragment>
              <TextLoader
                done={motorCortexStatus !== MotorCortexStatus.CONNECTING}
              />{" "}
              Body{" "}
              {motorCortexStatus === MotorCortexStatus.CONNECTED
                ? "connected"
                : "not connected"}
            </React.Fragment>,
          ]
    );
  }, [
    brain.status,
    auditoryCortexProgress,
    borcasAreaProgress,
    motorCortexStatus,
    llmProgress,
  ]);

  return (
    <React.Fragment>
      <AgentLog
        toggleOpen={() => setLogOpen(!logOpen)}
        className={cn(styles.log, { [styles.logOpen]: logOpen })}
      />
      <div
        className={cn(className, styles.root, {
          [styles.rootLogOpen]: logOpen,
        })}
      >
        <header className={styles.kitt}>
          <h1>K.I.T.T.</h1>
        </header>
        <div className={styles.top}>
          <div className={styles.left}>
            <ConnectCar
              disabled={!brainReady}
              connected={motorCortexStatus === MotorCortexStatus.CONNECTED}
            />
            <Listener disabled={!brainReady} />
            <Button
              disabled={motorCortexStatus !== MotorCortexStatus.CONNECTED}
              onClick={async () => {
                await brain.motorCortext.changeSpeed(0);
                await brain.motorCortext.changeTurn(0);
              }}
              color="yellow"
            >
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
              //disabled={audioDevices.length === 0}
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
              disabled={reloading}
              color="yellow"
              onClick={async () => {
                setReloading(true);
                await brain.wakeUp(
                  () => {},
                  () => {},
                  () => {}
                );
                setReloading(false);
              }}
            >
              reload
            </Button>
          </div>
        </div>
        {brainReady ? (
          <Kitt className={styles.kitt} volume={volume} />
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
    </React.Fragment>
  );
};

export default Cockpit;
