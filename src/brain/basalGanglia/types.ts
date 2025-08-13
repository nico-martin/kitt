import { z } from "zod";

import { LlmFactoryI } from "@utils/llm/types.ts";

export interface BasalGangliaFactory {
  llm: LlmFactoryI;
  addFunction: <T>(func: FunctionDefinition<T>) => void;
  initialize: (progress: (p: number) => void) => Promise<boolean>;
  evaluateNextStep: (
    request: string,
    options?: {
      maxRounds?: number;
      history?: Array<{ role: "function"; name: string; response: string }>;
      startedAt?: Date;
      round?: number;
    }
  ) => Promise<string>;
  prompt: (
    request: string,
    speak: (i: string) => void,
    options?: {
      maxRounds?: number;
      startedAt?: Date;
    }
  ) => Promise<string>;
}

export interface FunctionDefinition<T> {
  name: string;
  description: string;
  parameters: z.ZodType<T>;
  examples: Array<{
    query: string;
    parameters: T;
  }>;
  handler: (
    data: T,
    originalRequest: string
  ) => Promise<{
    response: string;
    maybeNextStep: boolean;
  }>;
}

export const EvaluateNextStepResponseSchema = z.object({
  functionName: z.union([z.string(), z.null()]),
  parameters: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.null()])
  ),
  finalAnswer: z.string().optional(),
});
