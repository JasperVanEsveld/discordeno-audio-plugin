import { Bot } from "../deps.ts";
import { asArray } from "../utils/array.ts";
import { EventSource } from "../utils/event-source.ts";
import { IterExpanded } from "../utils/iterator/util/iter-utils.ts";
import { getConnectionData } from "./connection-data.ts";
import { decodeAudio } from "./encoding.ts";
import { stripRTP } from "./mod.ts";

type ReceivedAudio = {
  bot: Bot;
  user: bigint;
  guildId: bigint;
  raw: Uint8Array;
  packet: {
    rtp: {
      version: number;
      type: number;
      sequence: number;
      timestamp: number;
      ssrc: number;
    };
    nonce: Uint8Array;
    data: Uint8Array;
  };
  decoded: Uint8Array;
};

export function createOnAudio(
  source: EventSource<{
    bot: Bot;
    guildId: bigint;
    data: Uint8Array;
  }>
) {
  return (
    guild: bigint | bigint[],
    user?: bigint | bigint[]
  ): IterExpanded<ReceivedAudio> => {
    const guilds = asArray(guild);
    const users = asArray(user);
    return source
      .iter()
      .filter(({ data }) => {
        return data[1] === 120;
      })
      .filter(({ guildId }) => guilds.includes(guildId))
      .map((payload) => {
        const conn = getConnectionData(payload.bot.id, payload.guildId);
        try {
          const packet = stripRTP(conn, payload.data);
          const user = conn.ssrcToUser.get(packet.rtp.ssrc);
          if (users.length > 0 && user && !users.includes(user)) {
            return undefined;
          }
          const decoded = decodeAudio(
            packet.data,
            packet.rtp.ssrc,
            packet.rtp.timestamp
          );
          return {
            bot: payload.bot,
            user,
            guildId: payload.guildId,
            raw: payload.data,
            packet,
            decoded,
          } as ReceivedAudio;
        } catch {
          console.log("Something is wrong...");
          return undefined;
        }
      })
      .filter((data) => data !== undefined)
      .map((data) => data!);
  };
}
