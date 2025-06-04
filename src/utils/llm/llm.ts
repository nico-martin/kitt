import { LlmProvider } from "@utils/settings/constants.ts";
import getSetting from "@utils/settings/getSetting.ts";

import Gemini from "./gemini/Gemini.ts";
import { LlmFactoryI } from "./types.ts";
import webLlmGemma2_2b from "./webllm/webLlmGemma2_2b.ts";
import webLlmGemma2_9b from "./webllm/webLlmGemma2_9b.ts";
import qwen from "./webllm/webLlmQwen3_4.ts";
import smollm2 from "./webllm/webLlmSmolLM2_1_7.ts";

const LLM: LlmFactoryI =
  getSetting("llmProvider") === LlmProvider.GEMINI
    ? Gemini
    : getSetting("llmProvider") === LlmProvider.GEMMA2_9B
      ? webLlmGemma2_9b
      : getSetting("llmProvider") === LlmProvider.SmolLM2
        ? smollm2
        : getSetting("llmProvider") === LlmProvider.QWEN
          ? qwen
          : webLlmGemma2_2b;

export default LLM;
