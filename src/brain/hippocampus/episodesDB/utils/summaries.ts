import { z } from "zod";

import cleanUpJsonArray from "@utils/cleanUpJsonArray.ts";
import LLM from "@utils/llm/llm.ts";

import { Act, Episode, Scene } from "../db/types.ts";
import splitTextIntoChunks from "./splitTextIntoChunks.ts";

const summariesSchema = z.array(z.string());

const createSummary = async (
  systemPrompt: string,
  prompt: string
): Promise<{
  summary: string;
  outputTokens: number;
  inputTokens: number;
}> => {
  const summary = await LLM.createConversation(systemPrompt, 0.1).generate(
    prompt
  );
  if (
    summary.output.trim() === "{null}" ||
    summary.output.trim() === '"{null}'
  ) {
    return {
      summary: "",
      outputTokens: summary?.stats?.outputTokens || 0,
      inputTokens: summary?.stats?.inputTokens || 0,
    };
  }
  return {
    summary: summary.output,
    outputTokens: summary?.stats?.outputTokens || 0,
    inputTokens: summary?.stats?.inputTokens || 0,
  };
};

const createSceneSummaryChunk = async (
  text: string
): Promise<{
  summaries: Array<string>;
  outputTokens: number;
  inputTokens: number;
}> => {
  try {
    if (text === "") {
      return { summaries: [], outputTokens: 0, inputTokens: 0 };
    }
    const maxPlots = Math.ceil(text.length / 2500);
    const summaryJSON = await createSummary(
      "You are a helpful AI assistant that summarizes scenes from TV series",
      `Following is a scene from the TV series Knight Rider.
      
INSTRUCTIONS:
Find the main plot lines (maximum ${maxPlots}, if there are less plots it can be less) in this scene and create a summary for each plot line.
If you don't have enough content to find at least one plot, return {null}
Each summmary should follow these rules:
- Always include the main characters that are in the scene and what they are doing.
- Summarize the plot to only one to two sentences.
- Only return the summary. Do not include the scene text or your thought process.

OUTPUT FORMAT:
Return a JSON array with the summaries as strings. Make sure it is valid JSON.

EXAMPLES:
\`\`\`JSON
["Michael is confident he can adapt and learn quickly. He believes he will be able to handle the challenges he faces.","Devon is working with Knight to prepare Michael for a dangerous mission. Michael is conflicted about his past and his future."]
\`\`\`

\`\`\`JSON
Michael is angry and threatening towards someone. Knight is impressed with Michael's new look and Devon is curious about the resemblance. Devon is confident Michael will be ready to go soon. Michael is conflicted about his past and his future.
\`\`\`

SCENE:\n${text}`
    );
    console.log("scene summary", summaryJSON.summary);
    const cleaned = cleanUpJsonArray(summaryJSON.summary);
    console.log("scene summary cleaned", cleaned);
    const summaries = JSON.parse(cleaned);

    if (!Array.isArray(summaries)) {
      throw new Error("Invalid JSON");
    }
    const summaryStrings = summariesSchema.parse(summaries);

    console.log("scene summary", summaryStrings);
    return {
      summaries: summaryStrings,
      outputTokens: summaryJSON.outputTokens,
      inputTokens: summaryJSON.inputTokens,
    };
  } catch (e) {
    console.error("scene summary failed", e);
    return null;
  }
};

export const createSceneSummary = async (
  scene: Scene
): Promise<{
  summaries: Array<string>;
  outputTokens: number;
  inputTokens: number;
}> => {
  if (scene.text === "") {
    return { summaries: [], outputTokens: 0, inputTokens: 0 };
  }
  const maxCharactersPerRequest = 4000 * 2;
  const requestTexts = splitTextIntoChunks(scene.text, maxCharactersPerRequest);
  const allSummaries = [];
  let inputTokens = 0;
  let outputTokens = 0;
  for (const text of requestTexts) {
    const {
      summaries,
      outputTokens: output,
      inputTokens: input,
    } = await createSceneSummaryChunk(text);
    summaries.map((summary) => allSummaries.push(summary));
    inputTokens += input;
    outputTokens += output;
  }
  return {
    summaries: allSummaries,
    outputTokens,
    inputTokens,
  };
};

export const createActSummary = async (
  act: Act,
  sceneSummaries: Array<string>
): Promise<{ summary: string; outputTokens: number; inputTokens: number }> => {
  try {
    if (sceneSummaries.length === 0) {
      return { summary: "", outputTokens: 0, inputTokens: 0 };
    }
    return await createSummary(
      "You are a helpful AI assistant that summarizes acts from TV series",
      `Following are summaries of scenes from an act from the TV series Knight Rider.

INSTRUCTIONS:
- Always include the main characters that are in the scene and what they are doing.
- Summarize the scene to only one to three sentences.
- Only return the summary. Do not include the scene text or your thought process.
- Only play text, no markdown or HTML.

EXAMPLES:
"Michael is confident he can adapt and learn quickly. He believes he will be able to handle the challenges he faces."
"Devon is working with Knight to prepare Michael for a dangerous mission. Michael is conflicted about his past and his future."
"Michael is angry and threatening towards someone. Knight is impressed with Michael's new look and Devon is curious about the resemblance. Devon is confident Michael will be ready to go soon. Michael is conflicted about his past and his future."

SCENES:\n${sceneSummaries.join("\n\n")}`
    );
  } catch (e) {
    console.error("act summary failed for", act.id, e);
    return { summary: "", outputTokens: 0, inputTokens: 0 };
  }
};

export const createEpisodeSummary = async (
  episode: Episode,
  actSummaries: Array<string>
): Promise<{ summary: string; outputTokens: number; inputTokens: number }> => {
  try {
    if (actSummaries.length === 0) {
      return { summary: "", outputTokens: 0, inputTokens: 0 };
    }
    return await createSummary(
      "You are a helpful AI assistant that summarizes episodes from TV series",
      `Following are summaries of acts from an episode from the TV series Knight Rider.

INSTRUCTIONS:
- Always include the main characters that are in the Episode and what they are doing.
- Summarize the Episode to only three to six sentences.
- Only return the summary. Do not include the scene text or your thought process.
- Only play text, no markdown or HTML.

EXAMPLES:
"Michael is confident he can adapt and learn quickly. He believes he will be able to handle the challenges he faces."
"Devon is working with Knight to prepare Michael for a dangerous mission. Michael is conflicted about his past and his future."
"Michael is angry and threatening towards someone. Knight is impressed with Michael's new look and Devon is curious about the resemblance. Devon is confident Michael will be ready to go soon. Michael is conflicted about his past and his future."

ACTS:
${actSummaries.join("\n\n")}`
    );
  } catch (e) {
    console.error("episode summary failed for", episode.id, e);
    return { summary: "", outputTokens: 0, inputTokens: 0 };
  }
};
