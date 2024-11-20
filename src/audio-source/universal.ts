import { getLocalSource } from "./local.ts";
import { getYoutubeSource } from "./youtube.ts";

export type LoadSource = typeof loadSource;

export async function loadSource(query: string) {
  return await loadLocalOrYoutube(query);
}

export async function* loadLocalOrYoutube(query: string) {
  const local = query.startsWith("./");
  if (local) {
    yield await getLocalSource(query);
  } else {
    const source = await getYoutubeSource(query);
    if (source !== undefined) {
      yield source;
    }
  }
}
