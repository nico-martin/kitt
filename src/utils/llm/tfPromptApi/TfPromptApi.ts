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
  public initialize = async (
    cb: (progress: number) => void
  ): Promise<boolean> => {
    await LanguageModel.create({
      temperature: 0,
      monitor: (m) => {
        m.addEventListener("downloadprogress", (e) => {
          cb(e.loaded);
        });
      },
    });
    cb(1);
    return true;
  };

  public createConversation = async (
    systemPrompt: string,
    temperature: number = 1
  ): Promise<{ generate: GenerateFn }> => {
    const session = await LanguageModel.create({
      initialPrompts: [{ role: "system", content: systemPrompt }],
      temperature,
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
