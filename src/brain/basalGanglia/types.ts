import { z } from "zod";

import { LlmFactoryI } from "@utils/llm/types.ts";

export interface BasalGangliaFactory {
  llm: LlmFactoryI;
  addFunction: <T>(func: FunctionDefinition<T>) => void;
  evaluateNextStep: (request: string) => Promise<string>;
}

interface FunctionParameter {
  name: string;
  type: "string" | "boolean" | "number";
  description: string;
  required: boolean;
}

export interface FunctionDefinition<T = any> {
  name: string;
  description: string;
  parameters: Array<FunctionParameter>;
  examples: string[];
  handler: (data: T, originalRequest: string) => Promise<string>;
}

export const EvaluateNextStepResponseSchema = z.object({
  functionName: z.union([z.string(), z.null()]),
  parameters: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.null()])
  ),
  confidence: z.number().min(0).max(1).optional(),
});
