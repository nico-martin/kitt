import featureExtraction from "@utils/featureExtraction/FeatureExtraction.ts";

import ScreenplayParser from "../utils/screenplayParser/ScreenplayParser.ts";
import { EpisodesDB } from "./episodes/db";
import fetchScreenplay from "./episodes/utils/fetchScreenplay.ts";
import {
  createActSummary,
  createEpisodeSummary,
  createSceneSummary,
} from "./episodes/utils/summaries.ts";

class Hippocampus {
  public rebuildMemory = async () => {
    if (
      (await EpisodesDB.getEpisodes()).length &&
      !confirm(
        "Are you sure you want to reload all episodes? This will empty the whole DB"
      )
    ) {
      return;
    }

    await EpisodesDB.clearAll();
    const episodesResp = await fetch("/episodes.json");
    const episodes = await episodesResp.json();
    let seasonNumber = 0;
    for (const season of episodes) {
      seasonNumber++;
      let episodeNumber = 0;
      for (const [title] of season) {
        episodeNumber++;
        try {
          const screenplay = await fetchScreenplay(seasonNumber, episodeNumber);
          const episodeId = await EpisodesDB.addEpisode({
            seasonNumber,
            episodeNumber,
            title,
            screenplay,
          });
          if (!screenplay) continue;
          const parsed = new ScreenplayParser(screenplay);
          const acts = parsed.getActs();
          let actNumber = 0;
          for (const act of acts) {
            actNumber++;
            const actId = await EpisodesDB.addAct({
              episodeId,
              title: act.act,
              actNumber,
            });
            let sceneNumber = 0;
            for (const scene of act.scenes) {
              sceneNumber++;
              await EpisodesDB.addScene({
                episodeId,
                actId,
                text: scene.text,
                sceneNumber,
              });
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  public processMemories = async (
    episodeId: number,
    log: (message?: string) => void = () => {},
    signal: AbortSignal = null,
    useCache: boolean = true
  ) => {
    let inputTokens = 0;
    let outputTokens = 0;
    const episode = await EpisodesDB.getEpisode(episodeId);

    const acts = await EpisodesDB.getActsByEpisode(episodeId);
    const actSummaries = [];
    for (const act of acts) {
      if (signal && signal.aborted) continue;
      const scenes = await EpisodesDB.getScenesByAct(act.id);
      const sceneSummaries = [];
      for (const scene of scenes) {
        if (signal && signal.aborted) continue;
        if (scene.text.length < 100) {
          log(
            `Skipped scene ${scene.sceneNumber} from act ${act.actNumber} from episode ${episode.episodeNumber}`
          );
          continue;
        }
        let summaries = useCache ? scene.summaries : null;
        if (!summaries) {
          const processed = await createSceneSummary(scene);
          summaries = processed.summaries;
          inputTokens += processed.inputTokens;
          outputTokens += processed.outputTokens;
        }
        sceneSummaries.push(...summaries);
        const summariesEmbedding = await featureExtraction.generate(summaries);
        log(
          `Processed scene ${scene.sceneNumber} from act ${act.actNumber} from episode ${episode.episodeNumber}`
        );
        log("SCENE: " + summaries.join(" "));
        await EpisodesDB.updateScene(scene.id, {
          summaries,
          summariesEmbedding,
        });
      }
      let actSummary = useCache ? act.summary : null;
      if (!actSummary) {
        const processed = await createActSummary(act, sceneSummaries);
        actSummary = processed.summary;
        inputTokens += processed.inputTokens;
        outputTokens += processed.outputTokens;
      }
      actSummaries.push(actSummary);
      const [summaryEmbedding] = await featureExtraction.generate([actSummary]);
      log(
        `Processed act ${act.actNumber} from episode ${episode.episodeNumber}`
      );
      log("ACT: " + actSummary);
      await EpisodesDB.updateAct(act.id, {
        summary: actSummary,
        summaryEmbedding,
      });
    }
    let episodeSummary = useCache ? episode.summary : null;
    if (!episodeSummary) {
      const processed = await createEpisodeSummary(episode, actSummaries);
      episodeSummary = processed.summary;
      inputTokens += processed.inputTokens;
      outputTokens += processed.outputTokens;
    }
    const [summaryEmbedding] = await featureExtraction.generate([
      episodeSummary,
    ]);
    log(`Processed episode ${episode.episodeNumber}`);
    log("EPISODE: " + episodeSummary);

    await EpisodesDB.updateEpisode(episode.id, {
      summary: episodeSummary,
      summaryEmbedding,
      summaryInputTokens: inputTokens,
      summaryOutputTokens: outputTokens,
    });
  };

  public getMemory = async (query: string) => {
    console.log(query);
  };
}

export default new Hippocampus();
