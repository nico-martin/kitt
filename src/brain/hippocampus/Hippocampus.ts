import Log from "@log";
import ScreenplayParser from "@nico-martin/screenplay-parser";
import { z } from "zod";

import featureExtraction from "@utils/featureExtraction";
import llm from "@utils/llm/llm.ts";
import reranker from "@utils/reranker";

import { FunctionDefinition } from "@brain/basalGanglia/types.ts";

import { EpisodesDB } from "./episodesDB/db";
import fetchScreenplay from "./episodesDB/utils/fetchScreenplay.ts";
import {
  createActSummary,
  createEpisodeSummary,
  createSceneSummary,
} from "./episodesDB/utils/summaries.ts";
import {
  HippocampusFactory,
  memoryAgentFunctionParametersSchema,
} from "./types.ts";

class Hippocampus implements HippocampusFactory {
  public rebuildMemoryFromEpisodes = async () => {
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
    signal: AbortSignal = new AbortController().signal,
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
        const summariesEmbedding =
          summaries.length > 0
            ? await featureExtraction.generate(summaries)
            : [];
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
    if (signal && signal.aborted) return;
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

  public regenerateVectorEmbeddings = async (
    episodeId: number,
    log: (message?: string) => void = () => {},
    signal: AbortSignal = null
  ) => {
    const episode = await EpisodesDB.getEpisode(episodeId);
    const acts = await EpisodesDB.getActsByEpisode(episodeId);
    for (const act of acts) {
      if (signal && signal.aborted) continue;
      const scenes = await EpisodesDB.getScenesByAct(act.id);
      for (const scene of scenes) {
        if (signal && signal.aborted) continue;
        const summaries = scene.summaries || [];
        const summariesEmbedding =
          summaries.length > 0
            ? await featureExtraction.generate(summaries)
            : [];
        log(
          `Processed scene ${scene.sceneNumber} from act ${act.actNumber} from episode ${episode.episodeNumber}`
        );
        console.log(summariesEmbedding);
        await EpisodesDB.updateScene(scene.id, {
          summariesEmbedding,
        });
      }
      const actSummary = act.summary || null;
      if (actSummary) {
        const [summaryEmbedding] = await featureExtraction.generate([
          actSummary,
        ]);
        log(
          `Processed act ${act.actNumber} from episode ${episode.episodeNumber}`
        );
        await EpisodesDB.updateAct(act.id, {
          summaryEmbedding,
        });
      }
    }
    if (signal && signal.aborted) return;
    const episodeSummary = episode.summary || null;
    if (episodeSummary) {
      const [summaryEmbedding] = await featureExtraction.generate([
        episodeSummary,
      ]);
      log(`Processed episode ${episode.episodeNumber}`);
      await EpisodesDB.updateEpisode(episode.id, {
        summaryEmbedding,
      });
    }
  };

  public exportMemory = async (fileName: string) => {
    const data = await EpisodesDB.export();
    const blob = new Blob([JSON.stringify(data)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.json`;
    a.click();
  };

  public importMemory = async () => {
    if (
      (await EpisodesDB.getEpisodes()).length &&
      !confirm(
        "Are you sure you want to reload all episodes? This will empty the whole DB"
      )
    ) {
      return;
    }

    const memoryResp = await fetch("/episodes-memory.json");
    const memory = await memoryResp.json();
    await EpisodesDB.importDump(memory.episodes, memory.acts, memory.scenes);
  };

  public getMemory = EpisodesDB.findScenes;

  public memoryAgentFunction: FunctionDefinition<
    z.infer<typeof memoryAgentFunctionParametersSchema>
  > = {
    name: "searchEpisode",
    description:
      "Search through all the Seasons, Episodes and Scenes from the Knight-Ride Series to find Memories to answer questions about KITT's past. Not the present!",
    parameters: memoryAgentFunctionParametersSchema,
    examples: [
      /*{
        query: "Why is devon so good at escaping prisons?",
        parameters: {
          question: "Do you remember when the car jumped over the river?",
        },
      },
      {
        query: "Do you remember when the car jumped over the river?",
        parameters: {
          question: "Do you remember when the car jumped over the river?",
        },
      },*/
      {
        query: "What was the color of the car that hurt you in season 5?",
        parameters: {
          question: "What was the color of the car that hurt you?",
          season: 5,
        },
      },
    ],
    handler: async (data, originalRequest) => {
      Log.addEntry({
        category: "searchEpisode",
        title: "call function with",
        message: [{ title: "data", content: data }],
      });

      const rephrasedQuestion = (
        await (
          await llm.createConversation(
            `You are a helpful AI assistant that rephrases questions.`,
            0.1
          )
        ).generate(
          `Rewrite the following question into a form optimized for vector search. If the question contains direct speech, rephrase it in the third person as if the question was directed to KITT. Output only the rewritten question. QUESTION: "${originalRequest}"`
        )
      ).output;

      Log.addEntry({
        category: "searchEpisode",
        title: "rephrasedQuestion",
        message: [{ title: "", content: rephrasedQuestion }],
      });

      const results = await this.getMemory(
        rephrasedQuestion,
        data.season,
        data.episode
      );
      Log.addEntry({
        category: "searchEpisode",
        title: `memory found ${results.length} results`,
        message: [{ title: "", content: results }],
      });

      const reranked = await reranker.rerank({
        compareWith: rephrasedQuestion,
        texts: results.map((r) => r.entry.summaries.join(" ")),
      });
      Log.addEntry({
        category: "searchEpisode",
        title: "reranked results",
        message: [{ title: "", content: reranked }],
      });

      const bestResults = [
        results[reranked[0].corpus_id].entry,
        results[reranked[1]?.corpus_id]?.entry,
        results[reranked[2]?.corpus_id]?.entry,
      ].filter(Boolean);

      Log.addEntry({
        category: "searchEpisode",
        title: "bestResult",
        message: [{ title: "", content: bestResults }],
      });

      const episodes = await Promise.all(
        bestResults.map((bestResult) =>
          EpisodesDB.getEpisode(bestResult.episodeId)
        )
      );
      const response = `${bestResults.map((result, i) => `\nSeason ${episodes[i].seasonNumber}, Episode ${episodes[i].episodeNumber}:\n${result.summaries.map((s) => `\n${s}`).join("\n\n")}`).join("\n\n")}`;
      Log.addEntry({
        category: "searchEpisode",
        title: "response",
        message: [{ title: "", content: response }],
      });

      return { response, maybeNextStep: true };
    },
  };
}

export default Hippocampus;
