import {
  FeatureExtractionFactory,
  FeatureExtractionInput,
  FeatureExtractionOutput,
} from "./types.ts";

const API_KEY = localStorage.getItem("GOOGLE_AI_STUDIO_API_KEY");

class FeatureExtractionGemini implements FeatureExtractionFactory {
  private postApi = async (text: string): Promise<Array<number>> => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${API_KEY}`;

    const requestBody = {
      model: "models/text-embedding-004",
      content: {
        parts: [{ text }],
      },
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    const body: { embedding: { values: Array<number> } } = await resp.json();
    return body.embedding.values;
  };

  public generate = async (
    texts: FeatureExtractionInput
  ): Promise<FeatureExtractionOutput> =>
    await Promise.all(texts.map(this.postApi));
}

export default FeatureExtractionGemini;
