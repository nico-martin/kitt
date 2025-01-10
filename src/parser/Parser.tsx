import { Button } from "@theme";
import React from "react";

import useLlm from "@utils/llm/useLlm.ts";

import parseScreenplay from "./utils/parseScreenplay.ts";
import scenesFromScreenplayItems from "./utils/scenesFromScreenplayItems.ts";
import { ItemType, SceneWithSummary, SceneWithText } from "./utils/types.ts";

const Parser: React.FC = () => {
  const { createConversation, setup } = useLlm();

  const parseEpisode = async (
    screenplay: string,
    title: string,
    season: number,
    episode: number
  ): Promise<void> => {
    const parsed = parseScreenplay(screenplay);
    console.log(parsed);
    const sceneObjects = scenesFromScreenplayItems(parsed);
    console.log(sceneObjects);
    const scenes: Array<SceneWithText> = sceneObjects
      .map((scene) => {
        let text = "";
        scene.sceneParts.filter(Boolean).map((scenePart) => {
          if (scenePart.type === ItemType.DIALOGUE) {
            text +=
              scenePart.dialogue
                .map((dialogue) => {
                  return `${dialogue.person}:\n${dialogue.text}`;
                })
                .join("\n\n") + "\n\n";
          }
          if (scenePart.type === ItemType.ACTION) {
            text +=
              scenePart.actions.map((action) => action).join("\n") + "\n\n";
          }
        });
        if (text) {
          return {
            ...scene,
            text: `${scene.scene}\n\n${text}`,
          };
        }
        return null;
      })
      .filter(Boolean);

    console.log("Starting setup");
    await setup();
    console.log("Setup done");

    const scenesWithSummary: Array<SceneWithSummary> = [];
    for (const scene of scenes) {
      try {
        const conversation = createConversation(
          "You are a helpful AI assistant. This is a scene from the show Knight Rider. Summarize this to just one sentence"
        );
        const answer = (
          await conversation.generate(`SCENE: ${scene.scene}:\n\n` + scene.text)
        ).trim();
        scenesWithSummary.push({
          ...scene,
          summary: answer,
        });
      } catch (e) {
        console.log("Error: Scene");
        console.log(scene);
        //console.error(e);
      }
    }

    let activeAct = "";
    const acts = scenesWithSummary.reduce(
      (
        acc: Array<{
          act: string;
          scenes: Array<SceneWithSummary>;
        }>,
        scene
      ) => {
        if (scene.act !== activeAct) {
          activeAct = scene.act;
          acc.push({
            act: scene.act,
            scenes: [],
          });
        }
        acc[acc.length - 1].scenes.push(scene);
        return acc;
      },
      []
    );
    console.log("acts:");
    console.log(acts);

    const actsWithSummary: Array<{
      act: string;
      scenes: Array<SceneWithSummary>;
      summary: string;
    }> = [];

    for (const act of acts) {
      try {
        const conversation = createConversation(
          "You are a helpful AI assistant. You get a summary of an act from the show Knight Rider. Summarize this to one sentence:"
        );
        const summary = (
          await conversation.generate(
            `ACT: ${act.act}\n\n` +
              act.scenes.map((scene) => scene.summary).join("\n\n")
          )
        ).trim();
        //console.log(`ACT ${act.act}:` + summary);
        actsWithSummary.push({
          ...act,
          summary,
        });
      } catch (e) {
        console.log("Error: Act");
        console.log(act);
        console.error(e);
      }
    }

    console.log("actsWithSummary:");
    console.log(actsWithSummary);
    const conversation = createConversation(
      "You are a helpful AI assistant. You get a summary of all the acts from an episode of the show Knight Rider. Summarize this to one sentence:"
    );
    const summary = (
      await conversation.generate(
        `TITLE: ${title}\n\nSUMMARY:\n\n` +
          actsWithSummary.map((scene) => scene.summary).join("\n\n")
      )
    ).trim();
    const json = JSON.stringify(
      { title, acts: actsWithSummary, summary },
      null,
      2
    );

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `knight-rider-${season}-${episode}.json`;
    a.click();
  };

  return (
    <div>
      <Button
        onClick={async () => {
          const seasons: Array<Array<[string, string]>> = [
            [
              [
                "Knight of the Phoenix",
                "http://knightriderarchives.com/knight_rider/season_one/pilot/scripts/9/",
              ],
              [
                "Deadly Maneuvers",
                "http://knightriderarchives.com/knight_rider/season_one/deadly_maneuvers/scripts/5/",
              ],
              [
                "Good Day at White Rock",
                "http://knightriderarchives.com/knight_rider/season_one/good_day_at_white_rock/scripts/2/",
              ],
              [
                "Slammin' Sammy's Stunt Show Spectacular",
                "http://knightriderarchives.com/knight_rider/season_one/slammin_sammys_stunt_show_spectacular/scripts/5/",
              ],
              [
                "Just My Bill",
                "http://knightriderarchives.com/knight_rider/season_one/just_my_bill/scripts/3/",
              ],
              [
                "Not a Drop To Drink",
                "http://knightriderarchives.com/knight_rider/season_one/not_a_drop_to_drink/scripts/2/",
              ],
              [
                "No Big Thing",
                "http://knightriderarchives.com/knight_rider/season_one/no_big_thing/scripts/2/",
              ],
              [
                "Trust Doesn't Rust",
                "http://knightriderarchives.com/knight_rider/season_one/trust_doesnt_rust/scripts/9/",
              ],
              [
                "Inside Out",
                "http://knightriderarchives.com/knight_rider/season_one/inside_out/scripts/1/",
              ],
              [
                "The Final Verdict",
                "http://knightriderarchives.com/knight_rider/season_one/the_final_verdict/scripts/6/",
              ],
              [
                "A Plush Ride",
                "http://knightriderarchives.com/knight_rider/season_one/a_plush_ride/scripts/3/",
              ],
              [
                "Forget Me Not",
                "http://knightriderarchives.com/knight_rider/season_one/forget_me_not/scripts/5/",
              ],
              [
                "Hearts of Stone",
                "http://knightriderarchives.com/knight_rider/season_one/hearts_of_stone/scripts/4/",
              ],
              [
                "Give Me Liberty... Or Give Me Death",
                "http://knightriderarchives.com/knight_rider/season_one/give_me_liberty_or_give_me_death/scripts/5/",
              ],
              [
                "The Topaz Connection",
                "http://knightriderarchives.com/knight_rider/season_one/the_topaz_connection/scripts/5/",
              ],
              [
                "A Nice, Indecent Little Town",
                "http://knightriderarchives.com/knight_rider/season_one/a_nice_indecent_little_town/scripts/2/",
              ],
              [
                "Chariot of Gold",
                "http://knightriderarchives.com/knight_rider/season_one/chariot_of_gold/scripts/8/",
              ],
              [
                "White Bird",
                "http://knightriderarchives.com/knight_rider/season_one/white_bird/scripts/4/",
              ],
              [
                "Knight Moves",
                "http://knightriderarchives.com/knight_rider/season_one/knight_moves/scripts/3/",
              ],
              [
                "Nobody Does It Better",
                "http://knightriderarchives.com/knight_rider/season_one/nobody_does_it_better/scripts/2/",
              ],
              [
                "Short Notice",
                "http://knightriderarchives.com/knight_rider/season_one/short_notice/scripts/3/",
              ],
            ],
          ];

          let seasonNumber = 0;
          for (const season of seasons) {
            seasonNumber++;
            let episodeNumber = 0;
            for (const [title, link] of season) {
              episodeNumber++;
              try {
                const resp = await fetch(`https://localhost:8443/?url=${link}`);
                const text = await resp.text();
                const wrapper = document.createElement("div");
                wrapper.innerHTML = text;
                const screenplay =
                  wrapper.querySelector("#content pre").textContent;
                wrapper.remove();
                await parseEpisode(
                  screenplay,
                  title,
                  seasonNumber,
                  episodeNumber
                );
              } catch (e) {
                console.log("Error: Episode", seasonNumber, episodeNumber);
                console.error(e);
              }
            }
          }
        }}
      >
        Load
      </Button>
    </div>
  );
};

export default Parser;
