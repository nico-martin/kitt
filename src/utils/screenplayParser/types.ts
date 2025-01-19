export enum ItemType {
  ACTION = "ACTION",
  TEXT = "TEXT",
  MISC = "MISC",
  INSTRUCTIONS = "INSTRUCTIONS",
  SEPARATOR = "SEPARATOR",
}

interface ItemBase {
  act: string;
  scene: string;
  rawLine: string;
}

export interface ItemAction extends ItemBase {
  type: ItemType.ACTION;
  action: string;
}

export interface ItemText extends ItemBase {
  type: ItemType.TEXT;
  text: string;
  instruction: string;
  speaker: string;
}

export interface ItemMisc extends ItemBase {
  type: ItemType.MISC;
  content: string;
}

export interface ItemInstructions extends ItemBase {
  type: ItemType.INSTRUCTIONS;
  instruction: string;
}

export interface ItemSeparator extends ItemBase {
  type: ItemType.SEPARATOR;
}

export type Item =
  | ItemAction
  | ItemText
  | ItemMisc
  | ItemInstructions
  | ItemSeparator;

export interface Scene {
  act: string;
  scene: string;
  items: Array<Item>;
  text: string;
}

export interface Act {
  act: string;
  scenes: Array<Scene>;
}

export enum ScreenplayLineType {
  ACTION = "ACTION",
  TEXT = "TEXT",
  PERSON = "PERSON",
  PERSON_INSTRUCTION = "PERSON_INSTRUCTION",
  INSTRUCTION = "INSTRUCTION",
}

export interface ParserOptions {
  indent: {
    [ScreenplayLineType.ACTION]: Array<number>;
    [ScreenplayLineType.TEXT]: Array<number>;
    [ScreenplayLineType.PERSON]: Array<number>;
    [ScreenplayLineType.PERSON_INSTRUCTION]: Array<number>;
    [ScreenplayLineType.INSTRUCTION]: Array<number>;
  };
}
