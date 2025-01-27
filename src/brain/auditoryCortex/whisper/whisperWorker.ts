import {
  AutoProcessor,
  AutoTokenizer,
  PreTrainedModel,
  PreTrainedTokenizer,
  Processor,
  TextStreamer,
  WhisperForConditionalGeneration,
  full,
} from "@huggingface/transformers";

import { WorkerRequestWhisper, WorkerResponseWhisper } from "./types.ts";

const postMessage = (e: WorkerResponseWhisper) => self.postMessage(e);
const onMessage = (cb: (e: MessageEvent<WorkerRequestWhisper>) => void) =>
  self.addEventListener("message", cb);

class ModelInstance {
  private static instance: ModelInstance = null;
  private tokenizer: PreTrainedTokenizer;
  private processor: Processor;
  private model: PreTrainedModel;
  private modelId: string = "onnx-community/whisper-base";

  public static getInstance() {
    if (!this.instance) {
      this.instance = new ModelInstance();
    }
    return this.instance;
  }

  public loadModel = async (
    log: () => void
  ): Promise<{
    tokenizer: PreTrainedTokenizer;
    processor: Processor;
    model: PreTrainedModel;
  }> => {
    if (this.tokenizer && this.processor && this.model) {
      return {
        tokenizer: this.tokenizer,
        processor: this.processor,
        model: this.model,
      };
    }
    const tokenizerPromise = AutoTokenizer.from_pretrained(this.modelId, {
      progress_callback: log,
    });

    const processorPromise = AutoProcessor.from_pretrained(this.modelId, {
      progress_callback: log,
    });

    const modelPromise = WhisperForConditionalGeneration.from_pretrained(
      this.modelId,
      {
        dtype: {
          encoder_model: "fp32", // 'fp16' works too
          decoder_model_merged: "q4", // or 'fp32' ('fp16' is broken)
        },
        device: "webgpu",
        progress_callback: log,
      }
    );

    const [tokenizer, processor, model] = await Promise.all([
      tokenizerPromise,
      processorPromise,
      modelPromise,
    ]);

    await model.generate({
      // @ts-ignore
      input_features: full([1, 80, 3000], 0.0),
      max_new_tokens: 1,
    });

    this.tokenizer = tokenizer;
    this.processor = processor;
    this.model = model;
    return {
      tokenizer: this.tokenizer,
      processor: this.processor,
      model: this.model,
    };
  };
}

onMessage(async (event) => {
  const instance = ModelInstance.getInstance();
  const log = (...e: Array<any>) =>
    event.data.log ? console.log("[WORKER]", ...e) : null;

  postMessage({ status: "loading", id: event.data.id });
  const { model, tokenizer, processor } = await instance.loadModel(log);

  postMessage({
    status: "ready",
    id: event.data.id,
  });

  if (!event.data.input.audio) {
    log("no input");
    postMessage({
      status: "complete",
      output: "",
      id: event.data.id,
    });
    return;
  }

  try {
    const streamer = new TextStreamer(tokenizer, {
      skip_prompt: true,
      // @ts-ignore
      skip_special_tokens: true,
      callback_function: () => {},
    });

    const inputs = await processor(event.data.input.audio);

    const outputs = await model.generate({
      ...inputs,
      max_new_tokens: event.data.input?.maxNewTokens || 64,
      language: event.data.input.language,
      streamer,
    });

    // @ts-ignore
    const outputText = tokenizer.batch_decode(outputs, {
      skip_special_tokens: true,
    });

    log("complete", outputText);
    postMessage({
      status: "complete",
      output: outputText.join(" "),
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
