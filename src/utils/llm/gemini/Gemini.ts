import { GeminiResponse } from "@utils/llm/gemini/types.ts";
import { GenerateFn, GenerateReturn, LlmFactoryI } from "@utils/llm/types.ts";

interface MessagePart {
  role: "user" | "system" | "model";
  content: string;
}

const API_KEY = localStorage.getItem("GOOGLE_AI_STUDIO_API_KEY");

class Gemini implements LlmFactoryI {
  public initialize = async (
    cb: (progress: number) => void
  ): Promise<boolean> => {
    cb(1);
    return true;
  };

  private postApi = async (
    messages: Array<MessagePart>,
    temperature
  ): Promise<GenerateReturn> => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const requestBody = {
      contents: messages.map((m) => ({
        role: m.role === "user" || m.role === "system" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
      generationConfig: { temperature },
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    const body: GeminiResponse = await resp.json();

    return {
      output: body.candidates[0].content.parts[0].text,
      stats: {
        outputTokens: body.usageMetadata.candidatesTokenCount,
        inputTokens: body.usageMetadata.promptTokenCount,
      },
    };
  };

  public createConversation = (
    systemPrompt: string,
    temperature: number = 1
  ): { generate: GenerateFn } => {
    if (!API_KEY) {
      throw new Error("GOOGLE_AI_STUDIO_API_KEY is required in localStorage");
    }
    const messages: Array<MessagePart> = [
      { role: "system", content: systemPrompt },
    ];

    return {
      generate: async (
        text: string,
        callback: (data: GenerateReturn) => void = () => {}
      ): Promise<GenerateReturn> => {
        messages.push({ role: "user", content: text });
        const generated = await this.postApi(messages, temperature);
        messages.push({ role: "model", content: generated.output });
        callback(generated);
        return generated;
      },
    };
  };
}

export default new Gemini();
