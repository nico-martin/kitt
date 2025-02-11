import { z } from "zod";

import { LlmFactoryI } from "@utils/llm/types.ts";

export interface BasalGangliaFactory {
  llm: LlmFactoryI;
  addFunction: <T>(func: FunctionDefinition<T>) => void;
  evaluateNextStep: (
    request: string,
    maxRounds?: number,
    history?: Array<{ role: "function"; name: string; response: string }>,
    startedAt?: Date,
    round?: number
  ) => Promise<string>;
}

export interface FunctionDefinition<T> {
  name: string;
  description: string;
  parameters: z.ZodType<T>;
  examples: Array<{
    query: string;
    parameters: T;
    output?: string;
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
  output: z.string().optional(),
});
