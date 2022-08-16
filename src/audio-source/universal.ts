import { getLocalSources } from "./local.ts";
import { getYoutubeSources } from "./youtube.ts";

export function loadSource(query: string) {
  const local = query.startsWith("./");
  if (local) {
    return getLocalSources(query);
  } else {
    return getYoutubeSources(query);
  }
}
