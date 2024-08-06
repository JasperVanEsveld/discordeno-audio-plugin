export * from "https://deno.land/x/discordeno@17.1.0/mod.ts";
export * from "https://deno.land/x/discordeno@17.1.0/plugins/cache/mod.ts";
export * as opus from "https://unpkg.com/@evan/wasm@0.0.95/target/opus/deno.js";
export * from "https://unpkg.com/@evan/wasm@0.0.95/target/nacl/deno.js";
export {
  ytDownload,
  getFormats,
  getDataStream,
} from "https://deno.land/x/yt_download@1.10/mod.ts";
import { default as yt_sr } from "npm:youtube-sr";
export const YouTube = yt_sr.YouTube;
