import { LlmProvider } from "@utils/settings/constants.ts";
import getSetting from "@utils/settings/getSetting.ts";

import Gemini from "./gemini/Gemini.ts";
import TfPromptApi from "./tfPromptApi/TfPromptApi.ts";
import { LlmFactoryI } from "./types.ts";

const LLM: LlmFactoryI =
  getSetting("llmProvider") === LlmProvider.GEMINI ? Gemini : TfPromptApi;

export default LLM;
