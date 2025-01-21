import Gemini from "./gemini/Gemini.ts";
import { LlmFactoryI } from "./types.ts";
import webLlmGemma2_2b from "./webllm/webLlmGemma2_2b.ts";
import webLlmGemma2_9b from "./webllm/webLlmGemma2_9b.ts";

const LLM: LlmFactoryI = localStorage.getItem("GOOGLE_AI_STUDIO_API_KEY")
  ? Gemini
  : localStorage.getItem("GEMMA2") === "9B"
    ? webLlmGemma2_9b
    : webLlmGemma2_2b;

export default LLM;
