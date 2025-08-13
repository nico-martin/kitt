import { LanguageModel } from "language-model-polyfill";

import { GenerateFn, GenerateReturn, LlmFactoryI } from "../types.ts";

const modelId = "Qwen3-4B";
LanguageModel.model_id = modelId;

class TfPromptApi implements LlmFactoryI {
  constructor() {
    LanguageModel.worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
  }

  public createConversation = async (
    systemPrompt: string,
    temperature: number = 1,
    cb: (progress: number) => void
  ): Promise<{ generate: GenerateFn }> => {
    let progress = 0;
    const session = await LanguageModel.create({
      initialPrompts: [{ role: "system", content: systemPrompt }],
      temperature,
      monitor: (m) => {
        m.addEventListener("downloadprogress", (e) => {
          const l = Math.round(e.loaded * 100) / 100;
          if (progress !== l) {
            progress = l;
            cb(l);
          }
        });
      },
    });

    return {
      generate: async (
        text: string,
        callback: (data: GenerateReturn) => void = () => {}
      ): Promise<GenerateReturn> => {
        const stream = session.promptStreaming(text);
        const reader = stream.getReader();
        let reply = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          reply += value;
          callback({
            output: reply,
          });
        }

        const usage = session.latestUsage;

        return {
          output: reply,
          stats: {
            outputTokens: usage.input_tokens,
            inputTokens: usage.output_tokens,
          },
        };
      },
    };
  };
}

export default new TfPromptApi();
