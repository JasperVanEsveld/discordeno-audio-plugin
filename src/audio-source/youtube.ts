import { YouTube, ytDownload } from "../../deps.ts";
import { bufferIter } from "../../utils/mod.ts";
import { demux } from "../demux/mod.ts";
import { createAudioSource, empty } from "./audio-source.ts";

function supportedFormatFilter(format: {
  codecs: string;
  container: string;
  audioSampleRate?: string;
}) {
  return (
    format.codecs === "opus" &&
    format.container === "webm" &&
    format.audioSampleRate === "48000"
  );
}

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
        try {
          const stream = await ytDownload(id!, {
            mimeType: `audio/webm; codecs="opus"`,
          });
          return bufferIter(demux(stream));
        } catch {
          console.error("error");
          console.log(`Failed to play ${title}\n Returning empty stream`);
          return empty();
        }
      });
    }
  } catch (error) {
    console.error(error);
    return undefined;
  }
}
