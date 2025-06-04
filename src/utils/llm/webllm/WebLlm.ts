import {
  ChatCompletionMessageParam,
  ChatCompletionRequestStreaming,
  CreateWebWorkerMLCEngine,
  WebWorkerMLCEngine,
} from "@mlc-ai/web-llm";
import { v4 as uuidv4 } from "uuid";

import { GenerateFn, GenerateReturn, LlmFactoryI } from "@utils/llm/types.ts";
import {
  GenerateCallbackData,
  GenerateCallbackStatus,
} from "@utils/llm/webllm/types.ts";

import Model from "./models/Model.ts";

class WebLlm extends EventTarget implements LlmFactoryI {
  private engine: WebWorkerMLCEngine = null;
  private queueInProgress = false;
  private model: Model | string = null;
  private queue: Array<{
    id: string;
    request: ChatCompletionRequestStreaming;
  }> = [];
  private logger: (data: any) => any = null;

  constructor(
    model: Model | string,
    logCallback: (data: any) => any = () => {}
  ) {
    super();
    this.model = model;
    this.logger = logCallback;
  }

  public initialize = async (
    callback: (progress: number) => void = null
  ): Promise<boolean> => {
    if (this.engine) {
      this.logger("Engine already initialized");
      return true;
    }
    this.engine = await CreateWebWorkerMLCEngine(
      new Worker(new URL("./worker.ts", import.meta.url), {
        type: "module",
      }),
      typeof this.model === "string" ? this.model : this.model.id,
      {
        ...(callback
          ? { initProgressCallback: (data) => callback(data.progress) }
          : {}),
        ...(typeof this.model !== "string"
          ? {
              appConfig: {
                model_list: [
                  {
                    model: this.model.url,
                    model_id: this.model.id,
                    model_lib: this.model.libUrl,
                  },
                ],
              },
            }
          : {}),
      }
    );
    this.executeQueue();
    return true;
  };

  private executeQueue = async () => {
    if (this.queue.length === 0) {
      this.logger("Queue is empty");
      return;
    }

    if (!this.engine) {
      this.logger("Engine not initialized");
      await this.initialize();
    }

    if (this.queueInProgress) {
      this.logger("Queue in progress");
      return;
    }

    this.queueInProgress = true;

    const request = this.queue.shift();
    this.dispatchGenerateUpdate(request.id, {
      status: GenerateCallbackStatus.THINKING,
      statusText: "Thinking...",
      output: "",
      modelId: typeof this.model === "string" ? this.model : this.model.id,
    });

    try {
      const chunks = await this.engine.chat.completions.create(request.request);
      let reply = "";
      for await (const chunk of chunks) {
        reply += chunk.choices[0]?.delta.content || "";
        this.dispatchGenerateUpdate(request.id, {
          status: chunk?.usage
            ? GenerateCallbackStatus.DONE
            : GenerateCallbackStatus.UPDATE,
          statusText: "",
          output: reply,
          stats: chunk?.usage || null,
          modelId: typeof this.model === "string" ? this.model : this.model.id,
        });
      }
    } catch (e) {
      this.dispatchGenerateUpdate(request.id, {
        status: GenerateCallbackStatus.ERROR,
        statusText: e.toString(),
        output: "",
        modelId: typeof this.model === "string" ? this.model : this.model.id,
      });
      console.log(e);
    }
    this.queueInProgress = false;
    this.executeQueue();
  };

  private dispatchGenerateUpdate = (id: string, data: GenerateCallbackData) =>
    this.dispatchEvent(
      new CustomEvent(`generate-event-${id}`, { detail: data })
    );

  private onGenerateUpdate = (
    id: string,
    callback: (data: GenerateCallbackData) => void
  ) => {
    const listener = (evt: CustomEvent<GenerateCallbackData>) => {
      callback(evt.detail);
    };
    this.addEventListener(`generate-event-${id}`, listener as EventListener);
    return () =>
      this.removeEventListener(
        `generate-event-${id}`,
        listener as EventListener
      );
  };

  public createConversation = (
    systemPrompt: string,
    temperature: number = 1
  ): { generate: GenerateFn } => {
    const messages: Array<ChatCompletionMessageParam> = [
      { role: "system", content: systemPrompt },
    ];
    if (!this.engine) {
      this.logger("Engine not initialized");
    }

    return {
      generate: async (
        text: string,
        callback: (data: GenerateReturn) => void = () => {}
      ): Promise<GenerateReturn> =>
        new Promise((resolve, reject) => {
          messages.push({
            role: "user",
            content: text,
          });

          const requestID = uuidv4();
          this.queue.push({
            id: requestID,
            request: {
              messages,
              temperature,
              stream: true,
              stream_options: { include_usage: true },
              extra_body: {
                enable_thinking: false,
              },
            },
          });
          callback({ output: "" });

          this.executeQueue();
          const removeListener = this.onGenerateUpdate(
            requestID,
            (data: GenerateCallbackData) => {
              data.stats && console.log(data?.stats?.extra);
              callback({
                output: data.output.replace("<think>\n\n</think>\n\n", ""),
                stats: {
                  outputTokens: data.stats?.completion_tokens || 0,
                  inputTokens: data.stats?.prompt_tokens || 0,
                },
              });
              if (data.status === "DONE") {
                resolve({
                  output: data.output.replace("<think>\n\n</think>\n\n", ""),
                  stats: {
                    outputTokens: data.stats?.completion_tokens || 0,
                    inputTokens: data.stats?.prompt_tokens || 0,
                  },
                });
                removeListener();
              }
              if (data.status === "ERROR") {
                reject(data.statusText);
                removeListener();
              }
            }
          );
        }),
    };
  };
}

export default WebLlm;
