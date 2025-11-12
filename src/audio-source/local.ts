import { createAudioSource } from "./audio-source.ts";
import { encodePCMAudio } from "../encoding.ts";
import { buffered, streamAsyncIterator } from "../../utils/mod.ts";
import { demux } from "../mod.ts";

export function getLocalSources(...queries: string[]) {
    return queries.map((query) => getLocalSource(query));
}

export function getLocalSource(query: string) {
    return createAudioSource(query, async () => {
        const file = await Deno.open(query, { read: true });
        if (query.endsWith(".opus")) {
            return buffered(demux(file.readable));
        }
        return encodePCMAudio(streamAsyncIterator(file.readable));
    });
}
