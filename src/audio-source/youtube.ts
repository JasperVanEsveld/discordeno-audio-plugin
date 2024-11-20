import type { Video } from "../../deps.ts";
import { createInnerTubeClient } from "../../utils/innertube.ts";
import { buffered } from "../../utils/mod.ts";
import { demux } from "../demux/mod.ts";
import { createAudioSource, empty } from "./audio-source.ts";

export async function* getYoutubeSources(...queries: string[]) {
  for (const query of queries) {
    try {
      const source = await getYoutubeSource(query);
      if (source !== undefined) {
        yield source;
      }
    } catch {
      // Skip songs with errors
    }
  }
}

let last_request = Date.now();
const requests_per_second = 0.25;

async function getRateLimit() {
  const time_between = 1000 / requests_per_second;
  last_request = Math.max(Date.now(), last_request + time_between);
  await new Promise((resolve) =>
    setTimeout(resolve, last_request - Date.now())
  );
}

const youtube = await createInnerTubeClient();

export async function getYoutubeSource(query: string) {
  await getRateLimit();
  const search = await youtube.search(query, {
    type: "video",
  });
  const video = search.videos.find((video) => video.type === "Video") as
    | Video
    | undefined;
  if (video === undefined) {
    throw `No videos found for ${query}`;
  }
  const title = video.title.toString();
  const info = await youtube.getBasicInfo(video.id);
  try {
    const format = info.chooseFormat({
      format: "opus",
      type: "audio",
      quality: "best",
    });
    const url = format.decipher(youtube.session.player);

    return createAudioSource(title, async () => {
      const response = await fetch(url);
      if (!response.ok) {
        console.log(`Error occured \`${title}\`\n Returning empty stream`);
      }
      const stream = response.body;
      if (stream === null) {
        console.log(`Failed to play \`${title}\`\n Returning empty stream`);
        return empty();
      }
      return buffered(demux(stream));
    });
  } catch {
    throw `Audio cannot be played for ${title}`;
  }
}
