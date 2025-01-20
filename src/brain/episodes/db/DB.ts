import { IDBPDatabase, openDB } from "idb";

import featureExtraction from "@utils/featureExtraction/FeatureExtraction.ts";

import VectorSearch from "../utils/vectorSearch/VectorSearch.ts";
import { Act, Episode, KnightRiderEpisodesDBSchema, Scene } from "./types.ts";

const dbName = "knight_rider_episodes";
const dbVersion = 1;

class DB {
  private db: IDBPDatabase<KnightRiderEpisodesDBSchema>;
  public getDb = async () => {
    if (!this.db) {
      this.db = await openDB<KnightRiderEpisodesDBSchema>(dbName, dbVersion, {
        upgrade(db, oldVersion, newVersion, transaction) {
          if (!db.objectStoreNames.contains("episodes")) {
            db.createObjectStore("episodes", {
              keyPath: "id",
              autoIncrement: true,
            });
          }

          if (!db.objectStoreNames.contains("acts")) {
            const acts = db.createObjectStore("acts", {
              keyPath: "id",
              autoIncrement: true,
            });
            acts.createIndex("episodeId", "episodeId");
          }

          if (!db.objectStoreNames.contains("scenes")) {
            const scenes = db.createObjectStore("scenes", {
              keyPath: "id",
              autoIncrement: true,
            });
            scenes.createIndex("episodeId", "episodeId");
            scenes.createIndex("actId", "actId");
            scenes.createIndex("summariesEmbedding", "summariesEmbedding", {
              unique: false,
              multiEntry: true,
            });
          }

          /*if (oldVersion === 1 && newVersion === 2) {
            const scenes = transaction.objectStore("scenes");
            scenes.createIndex("summariesEmbedding", "summariesEmbedding", {
              unique: false,
              multiEntry: true,
            });
          }*/
        },
      });
    }

    return this.db;
  };

  public addEpisode = async (episode: Episode): Promise<number> => {
    const db = await this.getDb();
    const tx = db.transaction("episodes", "readwrite");
    const id = await tx.store.add(episode);
    await tx.done;
    return id;
  };

  /**
   * Episodes
   */
  public getEpisodes = async (): Promise<Episode[]> => {
    const db = await this.getDb();
    return db.getAll("episodes");
  };

  public getEpisode = async (id: number): Promise<Episode> => {
    const db = await this.getDb();
    return db.get("episodes", id);
  };

  public updateEpisode = async (
    episodeId: number,
    episode: Partial<Episode>
  ) => {
    const db = await this.getDb();
    const tx = db.transaction("episodes", "readwrite");
    const existingEpisode = await tx.store.get(episodeId);
    await tx.store.put({ ...existingEpisode, ...episode });
  };

  public getEpisodesCount = async (): Promise<number> => {
    const db = await this.getDb();
    return db.count("episodes");
  };

  /**
   * Acts
   */
  public addAct = async (act: Act): Promise<number> => {
    const db = await this.getDb();
    const tx = db.transaction("acts", "readwrite");
    const id = await tx.store.add(act);
    await tx.done;
    return id;
  };

  public updateAct = async (actId: number, act: Partial<Act>) => {
    const db = await this.getDb();
    const tx = db.transaction("acts", "readwrite");
    const existingAct = await tx.store.get(actId);
    await tx.store.put({ ...existingAct, ...act });
  };

  public getActsByEpisode = async (episodeId: number): Promise<Act[]> => {
    const db = await this.getDb();
    const acts = await db.getAllFromIndex("acts", "episodeId", episodeId);
    return acts.sort((a, b) => a.actNumber - b.actNumber);
  };

  public getActsCount = async (): Promise<number> => {
    const db = await this.getDb();
    return db.count("acts");
  };

  /**
   * Scenes
   */
  public addScene = async (scene: Scene): Promise<number> => {
    const db = await this.getDb();
    const tx = db.transaction("scenes", "readwrite");
    const id = await tx.store.add(scene);
    await tx.done;
    return id;
  };

  public getScene = async (id: number): Promise<Scene> => {
    const db = await this.getDb();
    return db.get("scenes", id);
  };

  public findScenes = async (
    query: string,
    count: number = 10,
    embeddingSimilarityThreshold = 0.7
  ) => {
    const [queryEmbedding] = await featureExtraction.generate([query]);
    const vectorSearch = new VectorSearch(queryEmbedding);
    const db = await this.getDb();
    const tx = db.transaction("scenes", "readonly");
    const store = tx.store;
    const index = store.index("summariesEmbedding");

    const results = [];
    let cursor = await index.openCursor();
    while (cursor) {
      const similarityScore = vectorSearch.calculateSimilarityScore(
        cursor.key as unknown as Array<number>
      );
      if (
        similarityScore > embeddingSimilarityThreshold &&
        results.findIndex((r) => r.entry.id === cursor.value.id) === -1
      ) {
        results.push({ similarityScore, entry: cursor.value });
      }
      cursor = await cursor.continue();
    }

    return results
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, count);
  };

  public updateScene = async (
    sceneId: number,
    scene: Partial<Scene>
  ): Promise<void> => {
    const db = await this.getDb();
    const tx = db.transaction("scenes", "readwrite");
    const existingScene = await tx.store.get(sceneId);
    await tx.store.put({ ...existingScene, ...scene });
  };

  public getScenesByAct = async (actId: number): Promise<Scene[]> => {
    const db = await this.getDb();
    const scenes = await db.getAllFromIndex("scenes", "actId", actId);
    return scenes.sort((a, b) => a.sceneNumber - b.sceneNumber);
  };

  public getScenesCount = async (): Promise<number> => {
    const db = await this.getDb();
    return db.count("scenes");
  };

  public clearAll = async () => {
    const db = await this.getDb();
    await db.clear("episodes");
    await db.clear("acts");
    await db.clear("scenes");
  };
}

export default DB;
