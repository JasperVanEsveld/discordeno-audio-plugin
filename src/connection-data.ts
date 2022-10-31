import { Bot } from "../deps.ts";
import { EventSource } from "../utils/mod.ts";
import { AudioSource, LoadSource, UdpArgs } from "./mod.ts";
import { QueuePlayer } from "./player/mod.ts";
import { sendAudioPacket } from "./udp/packet.ts";

export type BotData = {
  bot: Bot;
  guildData: Map<bigint, ConnectionData>;
  udpSource: EventSource<[UdpArgs]>;
  bufferSize: number;
  loadSource: (query: string) => AudioSource[] | Promise<AudioSource[]>;
};

export type ConnectionData = {
  player: QueuePlayer;
  audio: EventSource<[Uint8Array]>;
  guildId: bigint;
  udpSocket: Deno.DatagramConn;
  udpStream: () => AsyncIterableIterator<Uint8Array>;
  ssrcToUser: Map<number, bigint>;
  usersToSsrc: Map<bigint, number>;
  context: {
    ssrc: number;
    ready: boolean;
    speaking: boolean;
    sequence: number;
    timestamp: number;
  };
  connectInfo: {
    endpoint?: string;
    sessionId?: string;
    token?: string;
  };
  stopHeart: () => void;
  remote?: { port: number; hostname: string };
  ws?: WebSocket;
  secret?: Uint8Array;
  mode?: string;
  resume?: boolean;
};

const connectionData = new Map<bigint, BotData>();

/**
 * Returns a random number that is in the range of n bits.
 *
 * @param n - The number of bits
 */
function randomNBit(n: number) {
  return Math.floor(Math.random() * 2 ** n);
}

export function createBotData(
  bot: Bot,
  udpSource: EventSource<[UdpArgs]>,
  loadSource: LoadSource,
  bufferSize = 10
) {
  const botData: BotData = {
    bot,
    guildData: new Map(),
    udpSource,
    bufferSize,
    loadSource,
  };
  connectionData.set(bot.id, botData);
  return botData;
}

export function getConnectionData(botId: bigint, guildId: bigint) {
  const botData = connectionData.get(botId);
  if (botData === undefined) {
    throw "Bot first needs to be connected!";
  }
  let data = botData.guildData.get(guildId);
  if (data === undefined) {
    let currentPort = 5000;
    let listening = false;
    let udpSocket: Deno.DatagramConn | undefined;
    while (!listening) {
      try {
        udpSocket = Deno.listenDatagram({
          hostname: "0.0.0.0",
          port: currentPort,
          transport: "udp",
        });
        listening = true;
      } catch (_err) {
        if (_err instanceof TypeError) {
          throw new Error("Please enable unstable by adding --unstable.");
        }
        currentPort++;
      }
    }
    udpSocket = udpSocket as Deno.DatagramConn;
    const udpReceive = new EventSource<[Uint8Array]>();
    data = {
      player: undefined as unknown as QueuePlayer,
      guildId,
      udpSocket,
      udpStream: () => udpReceive.iter().map(([packet]) => packet),
      context: {
        ssrc: 1,
        ready: false,
        speaking: false,
        sequence: randomNBit(16),
        timestamp: randomNBit(32),
      },
      connectInfo: {},
      audio: new EventSource<[Uint8Array]>(),
      ssrcToUser: new Map<number, bigint>(),
      usersToSsrc: new Map<bigint, number>(),
      stopHeart: () => {},
    };
    data.player = new QueuePlayer(data, botData.loadSource);
    botData.guildData.set(guildId, data);
    connectSocketToSource(
      botData.bot,
      guildId,
      udpSocket,
      botData.udpSource,
      udpReceive
    );
    connectAudioIterable(data);
  }
  return data;
}

async function connectAudioIterable(conn: ConnectionData) {
  for await (const [chunk] of conn.audio.iter()) {
    sendAudioPacket(conn, chunk);
  }
}

export function getUserSSRC(conn: ConnectionData, user: bigint) {
  return conn.usersToSsrc.get(user);
}

export function getUserBySSRC(conn: ConnectionData, ssrc: number) {
  return conn.ssrcToUser.get(ssrc);
}

export function setUserSSRC(conn: ConnectionData, user: bigint, ssrc: number) {
  conn.usersToSsrc.set(user, ssrc);
  conn.ssrcToUser.set(ssrc, user);
}

async function connectSocketToSource(
  bot: Bot,
  guildId: bigint,
  socket: Deno.DatagramConn,
  source: EventSource<[UdpArgs]>,
  localSource: EventSource<[Uint8Array]>
) {
  for await (const [data, _address] of socket) {
    source.trigger({ bot, guildId, data });
    localSource.trigger(data);
  }
}
