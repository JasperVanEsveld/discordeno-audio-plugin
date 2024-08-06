import { YouTube, getFormats, getDataStream } from "../../deps.ts";
import { buffered, retry } from "../../utils/mod.ts";
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

export async function getYoutubeSource(query: string) {
  await getRateLimit();
  const results = await YouTube.search(query, { limit: 1, type: "video" });
  if (results.length > 0) {
    const { id, title } = results[0];
    const formats = await getFormats(id!, {
      mimeType: `audio/webm; codecs="opus"`,
    });
    if (formats.length === 0) {
      throw `Could not find suitable format for \`${title}\``;
    }

    return createAudioSource(title!, async () => {
      const stream = await retry(async () => await getDataStream(formats[0]));
      if (stream === undefined) {
        console.log(`Failed to play \`${title}\`\n Returning empty stream`);
        return empty();
      }
      return buffered(demux(stream));
    });
  }
}
