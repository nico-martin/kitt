import Model from "./Model.ts";

const gemma3_4B = new Model({
  title: "Gemma3-4B",
  url: "https://uploads.nico.dev/mlc-llm-libs/gemma-3-12b-it-q4f16_1-MLC/",
  size: 4677059380,
  libUrl:
    "https://uploads.nico.dev/mlc-llm-libs/gemma-3-12b-it-q4f16_1-MLC/lib/gemma-3-12b-it-q4f16_1-webgpu.wasm",
  requiredFeatures: ["shader-f16"],
  cardLink: "https://huggingface.co/google/gemma-3-4b-it",
  about:
    "The Gemma3 model is a compact, state-of-the-art text generation model from Google's Gemma family. It excels in tasks like question answering, summarization, and reasoning, and is small enough to run on resource-limited devices, making advanced AI accessible and fostering innovation.",
});

export default gemma3_4B;
