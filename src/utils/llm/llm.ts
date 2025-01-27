import { LlmProvider } from "@utils/settings/constants.ts";
import getSetting from "@utils/settings/getSetting.ts";

import Gemini from "./gemini/Gemini.ts";
import { LlmFactoryI } from "./types.ts";
import webLlmGemma2_2b from "./webllm/webLlmGemma2_2b.ts";
import webLlmGemma2_9b from "./webllm/webLlmGemma2_9b.ts";

const LLM: LlmFactoryI =
  getSetting("llmProvider") === LlmProvider.GEMINI
    ? Gemini
    : getSetting("llmProvider") === LlmProvider.GEMMA2_9B
      ? webLlmGemma2_9b
      : webLlmGemma2_2b;

export default LLM;
