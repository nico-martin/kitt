import { Button, Modal } from "@theme";
import React from "react";

import { formatNumber, nl2br } from "@utils/formatters";

import Hippocampus from "../../brain/Hippocampus.ts";
import { EpisodesDB } from "../../brain/episodes/db";
import { Episode } from "../../brain/episodes/db/types.ts";
import styles from "./ManageEpisodesModal.module.css";

let abortController = new AbortController();

interface EpScene {
  title: string;
  text: string;
  summary: string;
}

interface Ep {
  id: number;
  title: string;
  season: string;
  summary: string;
  inputTokens: number;
  outputTokens: number;
  acts: Array<{
    title: string;
    summary: string;
    scenes: Array<EpScene>;
  }>;
}

const ManageEpisodesModal: React.FC<{
  show: boolean;
  setShow: (show: boolean) => void;
}> = ({ show, setShow }) => {
  const [scenesCount, setScenesCount] = React.useState<number>(0);
  const [actsCount, setActsCount] = React.useState<number>(0);
  const [episodesCount, setEpisodesCount] = React.useState<number>(0);
  const [episodes, setEpisodes] = React.useState<Array<Episode>>([]);
  const [processInProgress, setProcessInProgress] =
    React.useState<boolean>(false);
  const [activeEpisode, setActiveEpisode] = React.useState<Ep>(null);

  const fetchActiveEpisode = async (episodeId: number) => {
    const ep = await EpisodesDB.getEpisode(episodeId);
    const acts = await EpisodesDB.getActsByEpisode(episodeId);
    const result: Ep = {
      id: ep.id,
      title: ep.title,
      summary: ep.summary || "",
      inputTokens: ep.summaryInputTokens || 0,
      outputTokens: ep.summaryOutputTokens || 0,
      season: ep.seasonNumber.toString(),
      acts: [],
    };

    for (const act of acts) {
      const actScenes = await EpisodesDB.getScenesByAct(act.id);
      const scenes: Array<EpScene> = [];
      for (const scene of actScenes) {
        scenes.push({
          title: `${act.actNumber}-${scene.sceneNumber} (${scene.text.length})`,
          text: scene.text || "",
          summary: scene?.summaries?.join("---\n") || "",
        });
      }
      result.acts.push({
        title: act.actNumber.toString(),
        summary: act.summary || "",
        scenes,
      });
    }
    setActiveEpisode(result);
  };

  const load = () => {
    EpisodesDB.getScenesCount().then((count) => {
      setScenesCount(count);
    });
    EpisodesDB.getActsCount().then((count) => {
      setActsCount(count);
    });
    EpisodesDB.getEpisodesCount().then((count) => {
      setEpisodesCount(count);
    });
    EpisodesDB.getEpisodes().then((episodes) => {
      setEpisodes(episodes);
    });
  };

  React.useEffect(() => {
    load();
  }, []);
  return (
    <Modal
      show={show}
      setShow={setShow}
      title="Memories"
      classNameContent={styles.root}
    >
      <p className={styles.meta}>
        There are <code>{formatNumber(scenesCount)}</code> Scenes in{" "}
        <code>{formatNumber(actsCount)}</code> acts in{" "}
        <code>{formatNumber(episodesCount)}</code> episodes.
      </p>
      <div className={styles.searchEpisode}>
        <label htmlFor="selectEpisode">Select episode:</label>
        <select
          id="selectEpisode"
          onChange={(e) => fetchActiveEpisode(Number(e.target.value))}
        >
          <option>select..</option>
          {episodes.map((episode) => (
            <option key={episode.id} value={episode.id}>
              {episode.seasonNumber}-{episode.episodeNumber} - {episode.title}
            </option>
          ))}
        </select>
      </div>
      {activeEpisode && (
        <div className={styles.activeEpisode}>
          <h2 className={styles.activeEpisodeTitle}>
            {activeEpisode.title} (Season: {activeEpisode.season}){" "}
          </h2>
          <div className={styles.activeEpisodeProcess}>
            <Button
              disabled={processInProgress}
              onClick={async () => {
                setProcessInProgress(true);
                abortController = new AbortController();
                await Hippocampus.processMemories(
                  activeEpisode.id,
                  (entry) => console.log(entry),
                  abortController.signal,
                  false
                );
                setProcessInProgress(false);
                await fetchActiveEpisode(activeEpisode.id);
              }}
            >
              process Memories
            </Button>
            {processInProgress && (
              <Button
                onClick={() => {
                  abortController.abort();
                  setProcessInProgress(false);
                }}
              >
                cancel
              </Button>
            )}
          </div>
          {Boolean(activeEpisode.summary) && (
            <div className={styles.activeEpisodeSummary}>
              <p className={styles.activeEpisodeSummaryTokens}>
                Tokens: {formatNumber(activeEpisode.inputTokens)} /{" "}
                {formatNumber(activeEpisode.outputTokens)}
              </p>
              <p>{activeEpisode.summary}</p>
            </div>
          )}
          <ul className={styles.actList}>
            {activeEpisode.acts.map((act) => (
              <li className={styles.actElement}>
                <h3 className={styles.actTitle}>ACT {act.title}</h3>
                <p>{act.summary}</p>
                <ul className={styles.sceneList}>
                  {act.scenes.map((scene) => (
                    <li className={styles.sceneElement}>
                      <h4 className={styles.sceneTitle}>SCENE {scene.title}</h4>
                      <p
                        className={styles.sceneText}
                        dangerouslySetInnerHTML={{
                          __html: scene.summary
                            ? nl2br(scene.summary)
                            : nl2br(scene.text),
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <Button
          onClick={() =>
            Hippocampus.rebuildMemory().then(() => {
              load();
              setActiveEpisode(null);
            })
          }
        >
          reload
        </Button>
      </div>
    </Modal>
  );
};

export default ManageEpisodesModal;
