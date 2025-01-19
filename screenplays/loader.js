import * as cheerio from "cheerio";
import fs from "fs";
import fetch from "node-fetch";

import episodes from "../public/episodes.json" assert {type: "json"};

(async () => {
  let seasonNumber = 0;
  for (const season of episodes) {
    seasonNumber++;
    let episodeNumber = 0;
    for (const [, link] of season) {
      episodeNumber++;
      if (!link) {
        continue;
      }
      try {
        const resp = await fetch(link);
        const text = await resp.text();
        const $ = cheerio.load(text);
        let screenplay = $("#content pre").text();

        // Bug with 2-15
        if (seasonNumber === 2 && episodeNumber === 15) {
          const lines = screenplay.split("\n");
          screenplay = lines
            .map((line) => (line === "." ? "" : line))
            .join("\n");
        }

        fs.writeFileSync(
          `../public/screenplays/${seasonNumber}-${episodeNumber}.txt`,
          screenplay
        );
      } catch (e) {
        console.log("Error: Episode", seasonNumber, episodeNumber);
        console.error(e);
      }
    }
  }
})();
