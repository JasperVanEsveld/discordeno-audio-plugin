import { YouTube, ytDownload } from "../../deps.ts";
import { bufferIter, retry } from "../../utils/mod.ts";
import { demux } from "../demux/mod.ts";
import { createAudioSource, empty } from "./audio-source.ts";

export async function getYoutubeSources(...queries: string[]) {
  const sources = queries.map((query) => getYoutubeSource(query));
  const awaitedSources = await Promise.all(sources);
  return awaitedSources
    .filter((source) => source !== undefined)
    .map((source) => source!);
}

export async function getYoutubeSource(query: string) {
  try {
    const results = await YouTube.search(query, { limit: 1, type: "video" });
    if (results.length > 0) {
      const { id, title } = results[0];
      return createAudioSource(title!, async () => {
        const stream = await retry(
          async () =>
            await ytDownload(id!, {
              mimeType: `audio/webm; codecs="opus"`,
            })
        );
        if (stream === undefined) {
          console.log(`Failed to play ${title}\n Returning empty stream`);
          return empty();
        }
        return bufferIter(demux(stream));
      });
    }
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
