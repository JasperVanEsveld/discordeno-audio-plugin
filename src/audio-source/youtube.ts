import { YouTube, ytdl } from "../../deps.ts";
import { bufferIter } from "../../utils/mod.ts";
import { demux } from "../demux/mod.ts";
import { createAudioSource } from "./audio-source.ts";

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
  const results = await YouTube.search(query, { limit: 1, type: "video" });
  if (results.length > 0) {
    const { id, title } = results[0];
    return createAudioSource(title!, async () => {
      const info = await ytdl.getInfo(id!);
      const audio = await ytdl.downloadFromInfo(info, {
        filter: supportedFormatFilter,
      });
      return bufferIter(demux(audio));
    });
  }
}
