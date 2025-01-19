import {
  Act,
  Item,
  ItemType,
  ParserOptions,
  Scene,
  ScreenplayLineType,
} from "./types";

class ScreenplayParser {
  private screenplay: string;
  private parserOptions: ParserOptions = {
    indent: {
      [ScreenplayLineType.ACTION]: [0, 0],
      [ScreenplayLineType.TEXT]: [10, 10],
      [ScreenplayLineType.PERSON]: [25, 30],
      [ScreenplayLineType.PERSON_INSTRUCTION]: [15, 20],
      [ScreenplayLineType.INSTRUCTION]: [31, Infinity],
    },
  };
  private leftAlignmentWhitespaces: number;
  private indent: Record<ScreenplayLineType, Array<number>>;
  private items: Array<Item> = [];

  public constructor(
    screenplay: string,
    parserOptions: Partial<ParserOptions> = {}
  ) {
    if (!screenplay) {
      throw new Error("Screenplay is empty");
    }
    this.screenplay = screenplay;
    const indent = {
      ...this.parserOptions.indent,
      ...(parserOptions?.indent || {}),
    };

    this.parserOptions = {
      ...this.parserOptions,
      ...parserOptions,
      indent,
    };

    this.leftAlignmentWhitespaces = screenplay
      .split("\n")
      .reduce((acc, line) => {
        const leadingWhitespaces = line.search(/\S/);
        if (leadingWhitespaces === -1 || leadingWhitespaces >= acc) return acc;
        return leadingWhitespaces;
      }, 1000);

    this.indent = Object.values(ScreenplayLineType).reduce(
      (acc, type) => ({
        ...acc,
        [type]: indent[type].map(
          (insert) => insert + this.leftAlignmentWhitespaces
        ),
      }),
      {}
    ) as Record<ScreenplayLineType, Array<number>>;

    this.parseItems();
  }

  private inRange = (value: number, range: Array<number>): boolean =>
    range.length > 2 ? false : value >= range[0] && value <= range[1];

  private parseItems = (): void => {
    const lines = this.screenplay.split("\n");
    let currentAct: string = "ACT ZERO";
    let currentScene: string = "INTRO";
    const items: Array<Item> = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      const leadingWhitespaces = line.search(/\S/);
      if (leadingWhitespaces === -1) {
        items.push({
          type: ItemType.SEPARATOR,
          act: currentAct,
          scene: currentScene,
          rawLine: line,
        });
      } else if (trimmedLine.startsWith("ACT ")) {
        currentAct = trimmedLine;
      } else if (
        trimmedLine.match(/^(EXT\.|INT\.)/) /*||
        (this.inRange(
          leadingWhitespaces,
          this.indent[ScreenplayLineType.ACTION],
        ) &&
          trimmedLine === trimmedLine.toUpperCase())*/
      ) {
        currentScene = trimmedLine;
        items.push({
          type: ItemType.ACTION,
          action: trimmedLine,
          act: currentAct,
          scene: currentScene,
          rawLine: line,
        });
      } else if (
        this.inRange(leadingWhitespaces, this.indent[ScreenplayLineType.ACTION])
      ) {
        items.push({
          type: ItemType.ACTION,
          action: trimmedLine,
          act: currentAct,
          scene: currentScene,
          rawLine: line,
        });
      } else if (
        this.inRange(leadingWhitespaces, this.indent[ScreenplayLineType.TEXT])
      ) {
        const lastItemIndex = items.length - 1;
        if (
          items[lastItemIndex] &&
          items[lastItemIndex].type === ItemType.TEXT
        ) {
          items[lastItemIndex].text = [trimmedLine, items[lastItemIndex].text]
            .filter(Boolean)
            .join(" ");
          items[lastItemIndex].rawLine += "\n" + line;
        } else {
          console.log("Text line without a speaker", items[lastItemIndex]);
        }
      } else if (
        this.inRange(
          leadingWhitespaces,
          this.indent[ScreenplayLineType.PERSON_INSTRUCTION]
        )
      ) {
        const lastItemIndex = items.length - 1;
        if (
          items[lastItemIndex] &&
          items[lastItemIndex].type === ItemType.TEXT
        ) {
          items[lastItemIndex].instruction += " " + trimmedLine;
          items[lastItemIndex].rawLine += "\n" + line;
        } else {
          items.push({
            type: ItemType.INSTRUCTIONS,
            instruction: trimmedLine,
            act: currentAct,
            scene: currentScene,
            rawLine: line,
          });
        }
      } else if (
        this.inRange(leadingWhitespaces, this.indent[ScreenplayLineType.PERSON])
      ) {
        items.push({
          type: ItemType.TEXT,
          speaker: trimmedLine,
          text: "",
          instruction: "",
          act: currentAct,
          scene: currentScene,
          rawLine: line,
        });
      } else if (
        this.inRange(
          leadingWhitespaces,
          this.indent[ScreenplayLineType.INSTRUCTION]
        )
      ) {
        items.push({
          type: ItemType.INSTRUCTIONS,
          instruction: trimmedLine,
          act: currentAct,
          scene: currentScene,
          rawLine: line,
        });
      } else {
        items.push({
          type: ItemType.MISC,
          content: trimmedLine,
          act: currentAct,
          scene: currentScene,
          rawLine: line,
        });
      }
    }

    // Join Items with the same type
    const joinedResults: Array<Item> = [];
    for (const item of items) {
      const prevItem = joinedResults[joinedResults.length - 1];
      if (
        prevItem &&
        prevItem.type === item.type &&
        prevItem.act === item.act &&
        prevItem.scene === item.scene
      ) {
        if (
          item.type === ItemType.ACTION &&
          prevItem.type === ItemType.ACTION
        ) {
          prevItem.action += " " + item.action;
          prevItem.rawLine += "\n" + item.rawLine;
        } else if (
          item.type === ItemType.MISC &&
          prevItem.type === ItemType.MISC
        ) {
          prevItem.content += " " + item.content;
          prevItem.rawLine += "\n" + item.rawLine;
        } else if (
          item.type === ItemType.INSTRUCTIONS &&
          prevItem.type === ItemType.INSTRUCTIONS
        ) {
          prevItem.instruction += " " + item.instruction;
          prevItem.rawLine += "\n" + item.rawLine;
        }
      } else {
        joinedResults.push(item);
      }
    }

    this.items = joinedResults;
  };

  public getItems = (): Array<Item> => this.items;

  public getScenes = (items: Array<Item> = this.items): Array<Scene> => {
    const scenes: Array<{ act: string; scene: string; items: Array<Item> }> =
      [];
    for (const item of items) {
      const lastSceneIndex = scenes.length - 1;
      if (
        scenes[lastSceneIndex] &&
        scenes[lastSceneIndex].scene === item.scene
      ) {
        scenes[lastSceneIndex].items.push(item);
      } else {
        scenes.push({
          act: item.act,
          scene: item.scene,
          items: [item],
        });
      }
    }
    return scenes.map((scene) => ({
      ...scene,
      text: ScreenplayParser.joinItemsTexts(scene.items),
    }));
  };

  public getActs = (): Array<Act> => {
    const acts: Array<{ act: string; items: Array<Item> }> = [];
    for (const item of this.items) {
      const lastActIndex = acts.length - 1;
      if (acts[lastActIndex] && acts[lastActIndex].act === item.act) {
        acts[lastActIndex].items.push(item);
      } else {
        acts.push({
          act: item.act,
          items: [item],
        });
      }
    }

    return acts.map((act) => ({
      act: act.act,
      scenes: this.getScenes(act.items),
    }));
  };

  public static joinItemsTexts = (items: Array<Item>): string =>
    items
      .map((item) => {
        if (item.type === ItemType.ACTION) {
          return item.action;
        }
        if (item.type === ItemType.TEXT) {
          return [
            item.speaker + ":",
            item.instruction ? `(${item.instruction})` : "",
            `"${item.text}"`,
          ]
            .filter(Boolean)
            .join(" ");
        }
        if (item.type === ItemType.INSTRUCTIONS) {
          return item.instruction;
        }
        if (item.type === ItemType.MISC) {
          return item.content;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n\n");
}

export default ScreenplayParser;
