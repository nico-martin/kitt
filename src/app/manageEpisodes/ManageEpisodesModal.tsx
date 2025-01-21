import { EpisodesDB } from "@brain/hippocampus/episodesDB/db";
import { Episode } from "@brain/hippocampus/episodesDB/db/types.ts";
import useBrain from "@brain/useBrain.ts";
import { Button, Modal } from "@theme";
import React from "react";

import { formatNumber, nl2br } from "@utils/formatters";

import styles from "./ManageEpisodesModal.module.css";

//let abortController = new AbortController();

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
  const { brain } = useBrain();
  const [scenesCount, setScenesCount] = React.useState<number>(0);
  const [actsCount, setActsCount] = React.useState<number>(0);
  const [episodesCount, setEpisodesCount] = React.useState<number>(0);
  const [episodes, setEpisodes] = React.useState<Array<Episode>>([]);
  /*const [processInProgress, setProcessInProgress] =
    React.useState<boolean>(false);*/
  const [activeEpisode, setActiveEpisode] = React.useState<Ep>(null);
  const selectRef = React.useRef<HTMLSelectElement>(null);
  const [exportInProgress, setExportInProgress] =
    React.useState<boolean>(false);
  const [importInProgress, setImportInProgress] =
    React.useState<boolean>(false);

  const fetchActiveEpisode = async (episodeId: number) => {
    const ep = await EpisodesDB.getEpisode(episodeId);
    const acts = await EpisodesDB.getActsByEpisode(episodeId);
    const result: Ep = {
      id: ep.id,
      title: `${ep.seasonNumber}-${ep.episodeNumber} - ${ep.title}`,
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
          summary: scene?.summaries?.join("\n---\n") || "",
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

  const load = async () => {
    const [scenesCount, actsCount, episodesCount, episodes] = await Promise.all(
      [
        EpisodesDB.getScenesCount(),
        EpisodesDB.getActsCount(),
        EpisodesDB.getEpisodesCount(),
        EpisodesDB.getEpisodes(),
      ]
    );
    setScenesCount(scenesCount);
    setActsCount(actsCount);
    setEpisodesCount(episodesCount);
    setEpisodes(episodes);
    console.log(
      "summary input tokens:",
      formatNumber(episodes.reduce((acc, e) => acc + e.summaryInputTokens, 0))
    );
    console.log(
      "summary output tokens:",
      formatNumber(episodes.reduce((acc, e) => acc + e.summaryOutputTokens, 0))
    );
  };

  React.useEffect(() => {
    load();
  }, []);

  /*const processEpisode = async (episodeId: number, signal: AbortSignal) => {
    setProcessInProgress(true);
    await Hippocampus.processMemories(
      episodeId,
      (entry) => console.log(entry),
      signal,
      false
    );
    setProcessInProgress(false);
  };*/
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
          ref={selectRef}
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
          {/*<div className={styles.activeEpisodeProcess}>
            <Button
              disabled={processInProgress}
              onClick={async () => {
                let episodeId = activeEpisode.id;
                abortController = new AbortController();
                while (episodeId && !abortController.signal.aborted) {
                  selectRef.current.value = episodeId.toString();
                  await fetchActiveEpisode(episodeId);
                  try {
                    await processEpisode(episodeId, abortController.signal);
                    if (abortController.signal.aborted) continue;
                    const episodeIndex = episodes.findIndex(
                      (e) => e.id === episodeId
                    );
                    console.log("------------------");
                    console.log("------------------");
                    console.log("------------------");
                    console.log("------------------");
                    console.log("------------------");
                    console.log(
                      "DONE WITH",
                      episodes[episodeIndex].seasonNumber,
                      episodes[episodeIndex].title
                    );
                    const nextEpisode = episodes[episodeIndex + 1];
                    console.log("NEXT", nextEpisode?.id);
                    console.log("------------------");
                    console.log("------------------");
                    console.log("------------------");
                    console.log("------------------");
                    console.log("------------------");
                    episodeId = nextEpisode?.id;
                  } catch (e) {
                    console.error(e);
                    console.log("RETRY", episodeId);
                  }
                }
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
          </div>*/}
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
                <p className={styles.actSummary}>{act.summary}</p>
                <ul className={styles.sceneList}>
                  {act.scenes.map((scene, i) => (
                    <li key={i} className={styles.sceneElement}>
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
      <div className={styles.importExport}>
        Memory:
        <Button
          disabled={importInProgress}
          onClick={async () => {
            setImportInProgress(true);
            await brain.hippocampus.importMemory();
            await load();
            setActiveEpisode(null);
            setImportInProgress(false);
          }}
        >
          import
        </Button>
        <Button
          disabled={episodes.length === 0 || exportInProgress}
          onClick={async () => {
            setExportInProgress(true);
            await brain.hippocampus.exportMemory("kittMemory");
            setExportInProgress(false);
          }}
        >
          export
        </Button>
      </div>
    </Modal>
  );
};

export default ManageEpisodesModal;
