import { Bot } from "../deps.ts";
import { asArray } from "../utils/array.ts";
import { getConnectionData } from "./connection-data.ts";
import { decodeAudio } from "./encoding.ts";
import { stripRTP } from "./mod.ts";

export type ReceivedAudio = {
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

export function mapToAudio(
  options: { guild: bigint | bigint[]; user?: bigint | bigint[] },
  listener: (audio: ReceivedAudio) => void,
  udp: {
    bot: Bot;
    guildId: bigint;
    data: Uint8Array;
  }
) {
  const guilds = asArray(options.guild);
  const users = asArray(options.user);
  const { bot, guildId, data } = udp;
  if (data[1] !== 120 || !guilds.includes(guildId)) {
    return;
  }

  const conn = getConnectionData(bot.id, guildId);
  let audio: ReceivedAudio | undefined = undefined;
  try {
    const packet = stripRTP(conn, data);
    const user = conn.ssrcToUser.get(packet.rtp.ssrc);
    if (users.length > 0 && user && !users.includes(user)) {
      return;
    }
    const decoded = decodeAudio(
      packet.data,
      packet.rtp.ssrc,
      packet.rtp.timestamp
    );
    audio = {
      bot: bot,
      user,
      guildId: guildId,
      raw: data,
      packet,
      decoded,
    } as ReceivedAudio;
  } catch {
    return;
  }
  if (silence(...audio.decoded)) {
    return;
  }
  listener(audio);
}

function silence(...values: number[]) {
  for (const value of values) {
    if (value !== 0) {
      return false;
    }
  }
  return true;
}
