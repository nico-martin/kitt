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
  memoryAgentFunction: FunctionDefinition<{
    question: string;
    episode?: number;
    season?: number;
  }>;
}
