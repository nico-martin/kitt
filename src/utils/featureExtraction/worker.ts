import { FeatureExtractionPipeline, pipeline } from "@huggingface/transformers";

import {
  WorkerRequestFeatureExtraction,
  WorkerResponseFeatureExtraction,
} from "./types.ts";

const postMessage = (e: WorkerResponseFeatureExtraction) => self.postMessage(e);
const onMessage = (
  cb: (e: MessageEvent<WorkerRequestFeatureExtraction>) => void
) => self.addEventListener("message", cb);

/**
 * Embeddingmodels
 *
 * mixedbread-ai/mxbai-embed-large-v1, WhereIsAI/UAE-Large-V1
 * very good, but super slow
 *
 * Xenova/all-MiniLM-L6-v2
 * ok, super fast
 *
 * Xenova/all-mpnet-base-v2
 * better than all-MiniLM-L6-v2, but slower
 *
 * Xenova/paraphrase-multilingual-MiniLM-L12-v2
 * better than all-mpnet-base-v2, but slower
 */

class ModelInstance {
  private static instance: ModelInstance = null;
  private extractor: FeatureExtractionPipeline = null;
  private model: string = "Xenova/all-MiniLM-L6-v2";

  public static getInstance() {
    if (!this.instance) {
      this.instance = new ModelInstance();
    }
    return this.instance;
  }

  public loadExtractor = async (
    log: () => void
  ): Promise<FeatureExtractionPipeline> => {
    this.extractor = await pipeline("feature-extraction", this.model, {
      device: "webgpu",
      dtype: "fp32",
      progress_callback: log,
    });
    return this.extractor;
  };
}

onMessage(async (event) => {
  const instance = ModelInstance.getInstance();
  const log = (...e: Array<any>) =>
    event.data.log ? console.log("[WORKER]", ...e) : null;

  postMessage({ status: "loading", id: event.data.id });
  const extractor = await instance.loadExtractor(log);

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
    const output = await extractor(event.data.input, {
      pooling: "mean",
      normalize: true,
    });
    const outputList = output.tolist();

    log("complete", outputList);
    postMessage({
      status: "complete",
      output: outputList,
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
