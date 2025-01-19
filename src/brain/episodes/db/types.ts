import { DBSchema } from "idb";

export interface KnightRiderEpisodesDBSchema extends DBSchema {
  episodes: {
    key: number;
    value: Episode;
  };
  acts: {
    key: number;
    value: Act;
    indexes: {
      episodeId: number;
    };
  };
  scenes: {
    key: number;
    value: Scene;
    indexes: {
      episodeId: number;
      actId: number;
    };
  };
}

export interface Episode {
  id?: number;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  screenplay: string;
  summary?: string;
  summaryEmbedding?: Array<number>;
  summaryInputTokens?: number;
  summaryOutputTokens?: number;
}

export interface Act {
  id?: number;
  actNumber: number;
  episodeId: number;
  title: string;
  summary?: string;
  summaryEmbedding?: Array<number>;
}

export interface Scene {
  id?: number;
  sceneNumber: number;
  episodeId: number;
  actId: number;
  text: string;
  summaries?: Array<string>;
  summariesEmbedding?: Array<Array<number>>;
}
