import { LlmProvider } from "@utils/settings/constants.ts";
import getSetting from "@utils/settings/getSetting.ts";

import Gemini from "./gemini/Gemini.ts";
import { LlmFactoryI } from "./types.ts";
import webLlmGemma2_2b from "./webllm/webLlmGemma2_2b.ts";
import webLlmGemma2_9b from "./webllm/webLlmGemma2_9b.ts";
import webLlmLlama3_2_3B from "./webllm/webLlmLlama3_2_3B.ts";

const LLM: LlmFactoryI =
  getSetting("llmProvider") === LlmProvider.GEMINI
    ? Gemini
    : getSetting("llmProvider") === LlmProvider.GEMMA2_9B
      ? webLlmGemma2_9b
      : getSetting("llmProvider") === LlmProvider.LLAMA_3_2_3B
        ? webLlmLlama3_2_3B
        : webLlmGemma2_2b;

export default LLM;
