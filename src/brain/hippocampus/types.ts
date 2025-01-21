import { Scene } from "@brain/hippocampus/episodesDB/db/types.ts";

export interface HippocampusFactory {
  rebuildMemoryFromEpisodes: () => Promise<void>;
  processMemories: (
    episodeId: number,
    log: (message?: string) => void
  ) => Promise<void>;
  exportMemory: (fileName: string) => Promise<void>;
  importMemory: () => Promise<void>;
  getMemory: (
    query: string,
    count?: number,
    embeddingSimilarityThreshold?: number
  ) => Promise<Array<{ similarityScore: number; entry: Scene }>>;
}
