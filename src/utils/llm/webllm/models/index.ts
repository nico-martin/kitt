import Model from '@utils/llm/models/Model.ts';

import gemma2_2b from './Gemma2-2B.ts';
import gemma2_9b from './Gemma2-9B.ts';
import llama_3_2_1B from './Llama3_2_1B.ts';
import llama_3_2_3B from './Llama3_2_3B.ts';
import phi3_5_mini from './Phi3_5-mini.ts';
//import gemma2_27b from './Gemma2-27B.ts';
import promptApi from './PromptAPI.ts';

const models: Array<{ model: Model; available: boolean }> = [
  // @ts-ignore
  { model: promptApi, available: Boolean(window?.ai?.languageModel) },
  { model: gemma2_2b, available: true },
  { model: gemma2_9b, available: true },
  { model: phi3_5_mini, available: true },
  { model: llama_3_2_1B, available: true },
  { model: llama_3_2_3B, available: true },
  /*{ model: gemma2_27b, available: true },*/
].filter((m) => m.available);

export default models;
