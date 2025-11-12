import { streamAsyncIterator } from "../../utils/mod.ts";
import { getAudioStream, getVideoInfo } from "../../utils/youtube/mod.ts";
import { encodePCMAudio } from "../encoding.ts";
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
    await new Promise((resolve) => setTimeout(resolve, last_request - Date.now()));
}

export async function getYoutubeSource(query: string) {
    await getRateLimit();
    const info = await getVideoInfo(query);
    if (info === undefined) {
        throw `Could not find ${query}`;
    }

    try {
        return createAudioSource(info.title, async () => {
            const stream = await getAudioStream(info.id);
            if (stream === null) {
                console.log(`Failed to play \`${info.title}\`\n Returning empty stream`);
                return empty();
            }
            return encodePCMAudio(streamAsyncIterator(stream));
        });
    } catch {
        throw `Audio cannot be played for ${query}`;
    }
}
