import {
  ChatCompletionMessageParam,
  ChatCompletionRequestStreaming,
  CreateWebWorkerMLCEngine,
  WebWorkerMLCEngine,
} from "@mlc-ai/web-llm";
import { v4 as uuidv4 } from "uuid";

import {
  GenerateCallbackData,
  GenerateCallbackStatus,
  GenerateFn,
  GenerateReturn,
} from "@utils/llm/webllm/types.ts";

import Model from "./models/Model.ts";

class WebLlm extends EventTarget {
  private engine: WebWorkerMLCEngine = null;
  private queueInProgress = false;
  private model: Model = null;
  private queue: Array<{
    id: string;
    request: ChatCompletionRequestStreaming;
  }> = [];
  private logger: (data: any) => any = null;

  constructor(model: Model, logCallback: (data: any) => any = () => {}) {
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
      this.model.id,
      {
        ...(callback
          ? { initProgressCallback: (data) => callback(data.progress) }
          : {}),
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
      modelId: this.model.id,
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
          modelId: this.model.id,
        });
      }
    } catch (e) {
      this.dispatchGenerateUpdate(request.id, {
        status: GenerateCallbackStatus.ERROR,
        statusText: e.toString(),
        output: "",
        modelId: this.model.id,
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
            },
          });
          callback({ output: "" });

          this.executeQueue();
          const removeListener = this.onGenerateUpdate(
            requestID,
            (data: GenerateCallbackData) => {
              callback(data);
              if (data.status === "DONE") {
                resolve(data);
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
