import { asArray, EventSource } from "../utils/mod.ts";
import { createBotData, getConnectionData } from "./connection-data.ts";
import { QueuePlayer } from "./player/mod.ts";
import { connectWebSocket } from "./websocket/mod.ts";
import { Bot } from "../deps.ts";
import { createOnAudio } from "./listen.ts";
import { loadLocalOrYoutube, LoadSource } from "./audio-source/universal.ts";

export * from "./connection-data.ts";
export * from "./websocket/mod.ts";
export * from "./udp/mod.ts";
export * from "./encoding.ts";
export * from "./demux/mod.ts";
export * from "./player/mod.ts";
export * from "./audio-source/mod.ts";

export type UdpArgs = {
  bot: Bot;
  guildId: bigint;
  data: Uint8Array;
};

export type AudioBot<T extends Bot> = T & {
  helpers: ReturnType<typeof createAudioHelpers>;
};

export function enableAudioPlugin<T extends Bot>(
  bot: T,
  loadSource = loadLocalOrYoutube
): AudioBot<T> {
  Object.assign(bot.helpers, createAudioHelpers(bot, loadSource));
  return bot as AudioBot<T>;
}

function createAudioHelpers(bot: Bot, loadSource: LoadSource) {
  const udpSource = new EventSource<[UdpArgs]>();
  createBotData(bot, udpSource, loadSource);
  const resetPlayer = (guildId: bigint) => {
    const conn = getConnectionData(bot.id, guildId);
    const oldPlayer = conn.player;
    const oldQueue = asArray(oldPlayer.current());
    oldQueue.push(...oldPlayer.upcoming());
    conn.player = new QueuePlayer(conn, loadSource);
    conn.player.push(...oldQueue);
    oldPlayer.stopInterrupt();
    oldPlayer.stop();
    conn.player.loop(oldPlayer.looping);
    return conn.player;
  };
  const oldStateListener = bot.events.voiceStateUpdate;
  bot.events.voiceStateUpdate = (bot, event) => {
    const { guildId, userId, sessionId } = event;
    if (bot.id === userId && guildId) {
      const conn = getConnectionData(bot.id, guildId);
      conn.connectInfo.sessionId = sessionId;
      connectWebSocket(conn, bot.id, guildId);
    }
    oldStateListener(bot, event);
  };
  const oldServerListener = bot.events.voiceServerUpdate;
  bot.events.voiceServerUpdate = (bot, event) => {
    const { guildId, endpoint, token } = event;
    const conn = getConnectionData(bot.id, guildId);
    if (
      conn.connectInfo.endpoint === endpoint &&
      conn.connectInfo.token === token
    ) {
      return;
    }
    conn.connectInfo.endpoint = endpoint;
    conn.connectInfo.token = token;
    connectWebSocket(conn, bot.id, guildId);
    oldServerListener(bot, event);
  };
  return {
    getPlayer: (guildId: bigint) => {
      const conn = getConnectionData(bot.id, guildId);
      return conn.player;
    },
    resetPlayer,
    fixAudio: (guildId: bigint) => {
      resetPlayer(guildId);
      const conn = getConnectionData(bot.id, guildId);
      conn.ws?.close();
    },
    /**
     * Creates an async iterable with decoded audio packets
     */
    onAudio: createOnAudio(udpSource),
  };
}
