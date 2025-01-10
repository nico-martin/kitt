import * as cheerio from "cheerio";
import fs from "fs";
import fetch from "node-fetch";

import { seasons } from "./constants.js";

(async () => {
  let seasonNumber = 0;
  for (const season of seasons) {
    seasonNumber++;
    let episodeNumber = 0;
    for (const [title, link] of season) {
      episodeNumber++;
      if (!link) {
        continue;
      }
      try {
        const resp = await fetch(link);
        const text = await resp.text();

        // Load the HTML into Cheerio
        const $ = cheerio.load(text);

        // Query the content inside #content pre
        const screenplay = $("#content pre").text();
        fs.writeFileSync(
          `./screenplays/${seasonNumber}-${episodeNumber}.txt`,
          screenplay
        );
        //await parseEpisode(screenplay, title, seasonNumber, episodeNumber);
      } catch (e) {
        console.log("Error: Episode", seasonNumber, episodeNumber);
        console.error(e);
      }
    }
  }
})();
