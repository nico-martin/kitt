import WebLlmGemma2_2b from "@utils/llm/webllm/webLlmGemma2_2b.ts";
import WebLlmGemma2_9b from "@utils/llm/webllm/webLlmGemma2_9b.ts";

import { Act, Episode, Scene } from "../db/types.ts";
import splitTextIntoChunks from "./splitTextIntoChunks.ts";

const llm = WebLlmGemma2_2b;

const createSummary = async (
  systemPrompt: string,
  prompt: string
): Promise<{
  summary: string;
  outputTokens: number;
  inputTokens: number;
}> => {
  const summary = await llm
    .createConversation(systemPrompt, 0.1)
    .generate(prompt);
  if (
    summary.output.trim() === "{null}" ||
    summary.output.trim() === '"{null}'
  ) {
    return {
      summary: "",
      outputTokens: summary?.stats?.completion_tokens || 0,
      inputTokens: summary?.stats?.prompt_tokens || 0,
    };
  }
  return {
    summary: summary.output,
    outputTokens: summary?.stats?.completion_tokens || 0,
    inputTokens: summary?.stats?.prompt_tokens || 0,
  };
};

const boundaries = `INSTRUCTIONS:
- Always include the main characters that are in the scene and what they are doing.
- Summarize the scene to only one to three sentences.
- If you don't have enough content to summarise the scene, return {null}.
- Only return the summary. Do not include the scene text or your thought process.
- Only play text, no markdown or HTML.

EXAMPLES:
"Michael is confident he can adapt and learn quickly. He believes he will be able to handle the challenges he faces."
"Devon is working with Knight to prepare Michael for a dangerous mission. Michael is conflicted about his past and his future."
"Michael is angry and threatening towards someone. Knight is impressed with Michael's new look and Devon is curious about the resemblance. Devon is confident Michael will be ready to go soon. Michael is conflicted about his past and his future."
`;

const boundariesEp = `INSTRUCTIONS:
- Always include the main characters that are in the scene and what they are doing.
- Summarize the scene to only three to six sentences.
- If you don't have enough content to summarise the scene, return {null}.
- Only return the summary. Do not include the scene text or your thought process.
- Only play text, no markdown or HTML.
`;

const createSceneSummaryChunk = async (
  text: string
): Promise<{
  summary: string;
  outputTokens: number;
  inputTokens: number;
}> => {
  try {
    if (text === "") {
      return { summary: "", outputTokens: 0, inputTokens: 0 };
    }
    return await createSummary(
      "You are a helpful AI assistant that summarizes scenes from TV series",
      `Following is a scene from the TV series Knight Rider.\n\n${boundaries}\n\nSCENE:\n${text}`
    );
  } catch (e) {
    console.error("scene summary failed for", e);
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
  const summaries = [];
  let inputTokens = 0;
  let outputTokens = 0;
  for (const text of requestTexts) {
    const {
      summary,
      outputTokens: output,
      inputTokens: input,
    } = await createSceneSummaryChunk(text);
    summaries.push(summary);
    inputTokens += input;
    outputTokens += output;
  }
  return {
    summaries,
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
      `Following are summaries of scenes from an act from the TV series Knight Rider.\n\n${boundaries}\n\nSCENES:\n${sceneSummaries.join("\n\n")}`
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
      `Following are summaries of acts from an episode from the TV series Knight Rider.\n\n${boundariesEp}\n\nACTS:\n${actSummaries.join("\n\n")}`
    );
  } catch (e) {
    console.error("episode summary failed for", episode.id, e);
    return { summary: "", outputTokens: 0, inputTokens: 0 };
  }
};
