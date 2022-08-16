import { createAudioSource } from "./audio-source.ts";
import { encodePCMAudio } from "../encoding.ts";
import { streamAsyncIterator } from "../../utils/mod.ts";

export function getLocalSources(...queries: string[]) {
  return queries.map((query) => getLocalSource(query));
}

export function getLocalSource(query: string) {
  return createAudioSource(query, async () => {
    const file = await Deno.open(query, { read: true });
    return encodePCMAudio(streamAsyncIterator(file.readable));
  });
}
