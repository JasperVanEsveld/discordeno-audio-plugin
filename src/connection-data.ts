import { EventSource } from "../utils/mod.ts";
import { wait } from "../utils/wait.ts";
import { LoadSource, UdpArgs } from "./mod.ts";
import { QueuePlayer } from "./player/mod.ts";
import { FRAME_DURATION } from "./sample-consts.ts";
import { sendAudioPacket } from "./udp/packet.ts";

export type BotData = {
  botId: bigint;
  guildData: Map<bigint, ConnectionData>;
  udpSource: EventSource<UdpArgs>;
  bufferSize: number;
  loadSource: LoadSource;
};

export type ConnectionData = {
  player: QueuePlayer;
  audio: ReturnType<typeof createAudioStreamer>;
  guildId: bigint;
  udpSocket: Deno.DatagramConn;
  udpRaw: EventSource<Uint8Array>;
  ssrcToUser: Map<number, bigint>;
  usersToSsrc: Map<bigint, number>;
  context: {
    ssrc: number;
    ready: boolean;
    speaking: boolean;
    sequence: number;
    timestamp: number;
    missedHeart: number;
    lastHeart?: number;
    reconnect: number;
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
  botId: bigint,
  udpSource: EventSource<UdpArgs>,
  loadSource: LoadSource,
  bufferSize = 10,
) {
  const botData: BotData = {
    botId,
    guildData: new Map(),
    udpSource,
    bufferSize,
    loadSource,
  };
  connectionData.set(botId, botData);
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
    const udpRaw = new EventSource<Uint8Array>();
    data = {
      player: undefined as unknown as QueuePlayer,
      guildId,
      udpSocket,
      udpRaw,
      context: {
        ssrc: 1,
        ready: false,
        speaking: false,
        sequence: randomNBit(16),
        timestamp: randomNBit(32),
        missedHeart: 0,
        reconnect: 0,
      },
      connectInfo: {},
      audio: createAudioStreamer(),
      ssrcToUser: new Map<number, bigint>(),
      usersToSsrc: new Map<bigint, number>(),
      stopHeart: () => {},
    };
    data.player = new QueuePlayer(data, botData.loadSource);
    botData.guildData.set(guildId, data);
    connectSocketToSource(
      botData.botId,
      guildId,
      udpSocket,
      botData.udpSource,
      udpRaw,
    );
    connectAudioIterable(data);
  }
  return data;
}

function createAudioStreamer() {
  const eventsource = new EventSource<Uint8Array>();
  let n_frames = 0;
  let start = 0;
  return {
    iter: eventsource.iter,
    reset: function () {
      start = Date.now();
      n_frames = 0;
    },
    trigger: async function (chunk: Uint8Array) {
      const expected_timestamp = start + n_frames * FRAME_DURATION;
      const timestamp = Date.now();
      const time_to_wait = expected_timestamp - timestamp;
      if (Math.abs(time_to_wait / FRAME_DURATION) > 2) {
        this.reset();
      }
      await wait(Math.max(0, time_to_wait));
      eventsource.trigger(chunk);
      n_frames += 1;
    },
  };
}

async function connectAudioIterable(conn: ConnectionData) {
  for await (const chunk of conn.audio.iter()) {
    await sendAudioPacket(conn, chunk);
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
  botId: bigint,
  guildId: bigint,
  socket: Deno.DatagramConn,
  source: EventSource<UdpArgs>,
  localSource: EventSource<Uint8Array>,
) {
  for await (const [data, _address] of socket) {
    source.trigger({ botId, guildId, data });
    localSource.trigger(data);
  }
}
