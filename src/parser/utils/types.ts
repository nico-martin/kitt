export enum ItemType {
  ACT = "ACT",
  SCENE = "SCENE",
  ACTION = "ACTION",
  DIALOGUE = "DIALOGUE",
}

export interface Item {
  type: ItemType;
  text: string;
  person?: string;
}

interface ScenePartAction {
  type: ItemType.ACTION;
  actions: Array<string>;
  items: Array<Item>;
}

interface ScenePartDialogue {
  type: ItemType.DIALOGUE;
  dialogue: Array<{
    person: string;
    text: string;
  }>;
  items: Array<Item>;
}

export type ScenePart = ScenePartAction | ScenePartDialogue;

export interface Scene {
  act: string;
  scene: string;
  items: Array<Item>;
  sceneParts: Array<ScenePart>;
}

export interface SceneWithText extends Scene {
  text: string;
}

export interface SceneWithSummary extends Scene {
  summary: string;
}
