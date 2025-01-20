interface Part {
  text: string;
}

interface Content {
  parts: Part[];
  role: string;
}

interface Candidate {
  content: Content;
  finishReason: string;
  avgLogprobs: number;
}

interface UsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export interface GeminiResponse {
  candidates: Candidate[];
  usageMetadata: UsageMetadata;
  modelVersion: string;
}
