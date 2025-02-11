import { z } from "zod";

import { FunctionDefinition } from "@brain/basalGanglia/types.ts";
import { Scene } from "@brain/hippocampus/episodesDB/db/types.ts";

export interface HippocampusFactory {
  rebuildMemoryFromEpisodes: () => Promise<void>;
  processMemories: (
    episodeId: number,
    log: (message?: string) => void,
    signal: AbortSignal,
    useCache: boolean
  ) => Promise<void>;
  regenerateVectorEmbeddings: (
    episodeId: number,
    log: (message?: string) => void,
    signal: AbortSignal
  ) => Promise<void>;
  exportMemory: (fileName: string) => Promise<void>;
  importMemory: () => Promise<void>;
  getMemory: (
    query: string,
    count?: number,
    embeddingSimilarityThreshold?: number
  ) => Promise<Array<{ similarityScore: number; entry: Scene }>>;
  memoryAgentFunction: FunctionDefinition<
    z.infer<typeof memoryAgentFunctionParametersSchema>
  >;
}

export const memoryAgentFunctionParametersSchema = z.object({
  question: z
    .string()
    .nonempty()
    .describe(
      "The exact question the user asked without reference to the season or episode number."
    ),
  episode: z
    .number()
    .int()
    .describe("The episode number if specified")
    .optional(),
  season: z
    .number()
    .int()
    .describe("The season number if specified")
    .optional(),
});
