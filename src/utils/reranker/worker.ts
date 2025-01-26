import {
  AutoModelForSequenceClassification,
  AutoTokenizer,
} from "@huggingface/transformers";

import { WorkerRequestReranker, WorkerResponseReranker } from "./types.ts";

const postMessage = (e: WorkerResponseReranker) => self.postMessage(e);
const onMessage = (cb: (e: MessageEvent<WorkerRequestReranker>) => void) =>
  self.addEventListener("message", cb);

class ModelInstance {
  private static instance: ModelInstance = null;
  private model: AutoModelForSequenceClassification = null;
  private tokenizer: AutoTokenizer = null;
  private modelId: string = "khoj-ai/mxbai-rerank-base-v1";

  public static getInstance() {
    if (!this.instance) {
      this.instance = new ModelInstance();
    }
    return this.instance;
  }

  public loadModel = async (
    log: () => void
  ): Promise<{
    model: AutoModelForSequenceClassification;
    tokenizer: AutoTokenizer;
  }> => {
    this.model = await AutoModelForSequenceClassification.from_pretrained(
      this.modelId,
      {
        device: "webgpu",
        dtype: "fp32",
        progress_callback: log,
      }
    );
    this.tokenizer = await AutoTokenizer.from_pretrained(this.modelId);
    return { model: this.model, tokenizer: this.tokenizer };
  };
}

onMessage(async (event) => {
  const instance = ModelInstance.getInstance();
  const log = (...e: Array<any>) =>
    event.data.log ? console.log("[WORKER]", ...e) : null;

  postMessage({ status: "loading", id: event.data.id });
  const { model, tokenizer } = await instance.loadModel(log);

  postMessage({
    status: "ready",
    id: event.data.id,
  });

  if (!event.data.input) {
    log("no input");
    postMessage({
      status: "complete",
      output: [],
      id: event.data.id,
    });
    return;
  }

  try {
    const rank = async (
      query: string,
      documents: Array<string>,
      { top_k = undefined, return_documents = false } = {}
    ) => {
      // @ts-ignore
      const inputs = tokenizer(new Array(documents.length).fill(query), {
        text_pair: documents,
        padding: true,
        truncation: true,
      });
      // @ts-ignore
      const { logits } = await model(inputs);
      return logits
        .sigmoid()
        .tolist()
        .map(([score], i) => ({
          corpus_id: i,
          score,
          ...(return_documents ? { text: documents[i] } : {}),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, top_k);
    };

    const scores = await rank(
      event.data.input.compareWith,
      event.data.input.texts,
      {
        return_documents: true,
      }
    );

    log("complete", scores);
    postMessage({
      status: "complete",
      output: scores,
      id: event.data.id,
    });
  } catch (error) {
    log("ERROR", error);
    postMessage({
      status: "error",
      error: error,
      id: event.data.id,
    });
  }
});
