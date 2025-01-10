import { Item, ItemType, Scene, ScenePart } from "./types.ts";

const scenesFromScreenplayItems = (items: Array<Item>): Array<Scene> => {
  const result: Array<Scene> = [];
  let currentAct: string = "";
  let currentScene: Scene = { act: "", scene: "", items: [], sceneParts: [] };
  let currentScenePart: ScenePart = null;

  for (const item of items) {
    if (item.type === ItemType.ACT) {
      currentAct = item.text;
    }
    if (item.type === ItemType.SCENE) {
      if (currentScene.items.length) {
        result.push(currentScene);
        currentScene = {
          act: currentAct,
          scene: item.text,
          items: [],
          sceneParts: [],
        };
      } else {
        currentScene.scene = item.text;
      }
    } else if (item.type === ItemType.ACTION) {
      if (!currentScenePart || currentScenePart.type !== ItemType.ACTION) {
        currentScene.sceneParts.push(currentScenePart);
        currentScenePart = { type: ItemType.ACTION, actions: [], items: [] };
      }
      currentScenePart.actions.push(item.text);
      currentScenePart.items.push(item);
      currentScene.items.push(item);
    } else if (item.type === ItemType.DIALOGUE) {
      if (!currentScenePart || currentScenePart.type !== ItemType.DIALOGUE) {
        currentScene.sceneParts.push(currentScenePart);
        currentScenePart = { type: ItemType.DIALOGUE, dialogue: [], items: [] };
      }
      currentScenePart.dialogue.push({
        person: item.person || "",
        text: item.text,
      });
      currentScenePart.items.push(item);
      currentScene.items.push(item);
    }
  }

  if (currentScene.items.length) {
    result.push(currentScene);
  }

  return result.filter((r) => !r.scene || r.act || !r.sceneParts.length);
};

export default scenesFromScreenplayItems;
