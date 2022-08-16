import { getLocalSources } from "./local.ts";
import { getYoutubeSources } from "./youtube.ts";

export type LoadSource = typeof loadLocalOrYoutube;

export function loadLocalOrYoutube(query: string) {
  const local = query.startsWith("./");
  if (local) {
    return getLocalSources(query);
  } else {
    return getYoutubeSources(query);
  }
}
