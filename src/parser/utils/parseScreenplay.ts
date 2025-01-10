import { Item, ItemType } from "./types.ts";

const parseScreenplay = (screenplay: string): Array<Item> => {
  const lines = screenplay.split("\n");
  const result: Array<Item> = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith("ACT")) {
      result.push({ type: ItemType.ACT, text: trimmedLine });
    } else if (trimmedLine.match(/^(EXT\.|INT\.)/)) {
      result.push({ type: ItemType.SCENE, text: trimmedLine });
    } else if (
      trimmedLine.match(/^[A-Z]+(?:'S)?$/) &&
      !trimmedLine.includes(" ")
    ) {
      result.push({ type: ItemType.DIALOGUE, text: "", person: trimmedLine });
    } else if (trimmedLine) {
      const lastEntry = result[result.length - 1];
      if (
        lastEntry &&
        lastEntry.type === ItemType.DIALOGUE &&
        lastEntry.person
      ) {
        lastEntry.text += (lastEntry.text ? " " : "") + trimmedLine;
      } else {
        result.push({ type: ItemType.ACTION, text: trimmedLine });
      }
    }
  }

  return result;
};

export default parseScreenplay;
