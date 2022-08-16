import { VoiceOpcodes } from "../../deps.ts";
import { ConnectionData, setUserSSRC } from "../connection-data.ts";
import { discoverIP } from "../udp/discover.ts";
import { setSpeaking } from "../udp/speaking.ts";
import { sendHeart } from "./heartbeat.ts";

export enum ServerVoiceOpcodes {
  /** Complete the websocket handshake. */
  Ready = VoiceOpcodes.Ready,
  /** Describe the session. */
  SessionDescription = VoiceOpcodes.SessionDescription,
  /** Indicate which users are speaking. */
  Speaking = VoiceOpcodes.Speaking,
  /** Sent to acknowledge a received client heartbeat. */
  HeartbeatACK = VoiceOpcodes.HeartbeatACK,
  /** Time to wait between sending heartbeats in milliseconds. */
  Hello = VoiceOpcodes.Hello,
  /** Acknowledge a successful session resume. */
  Resumed = VoiceOpcodes.Resumed,
  /** A client has disconnected from the voice channel */
  ClientDisconnect = VoiceOpcodes.ClientDisconnect,
  /** Weird OP code containing video and audio codecs */
  Undocumented = 14,
}

export const socketHandlers: Record<
  ServerVoiceOpcodes,
  (connectionData: ConnectionData, d: any) => void
> = {
  [ServerVoiceOpcodes.Ready]: ready,
  [ServerVoiceOpcodes.SessionDescription]: sessionDescription,
  [ServerVoiceOpcodes.Speaking]: speaking,
  [ServerVoiceOpcodes.HeartbeatACK]: heartbeatACK,
  [ServerVoiceOpcodes.Hello]: hello,
  [ServerVoiceOpcodes.Resumed]: resumed,
  [ServerVoiceOpcodes.ClientDisconnect]: clientDisconnect,
  [ServerVoiceOpcodes.Undocumented]: undocumented,
};

function hello(conn: ConnectionData, d: { heartbeat_interval: number }) {
  conn.stopHeart = sendHeart(conn.ws!, d.heartbeat_interval);
}

function ready(conn: ConnectionData, d: any) {
  const { ssrc, port, ip } = d;
  conn.context.ssrc = ssrc;
  conn.remote = { port, hostname: ip };
  discoverIP(conn, ssrc, ip, port).then((info) => {
    if (conn.ws?.readyState === WebSocket.OPEN) {
      conn.ws.send(
        JSON.stringify({
          op: VoiceOpcodes.SelectProtocol,
          d: {
            protocol: "udp",
            data: {
              address: info.ip,
              port: info.port,
              mode: "xsalsa20_poly1305",
            },
          },
        })
      );
    }
  });
}

function resumed(conn: ConnectionData) {
  console.log("Resumed success");
  conn.context.ready = true;
}

function sessionDescription(conn: ConnectionData, d: any) {
  const secret = d.secret_key;
  const mode = d.mode;
  conn.secret = new Uint8Array(secret);
  conn.mode = mode;
  conn.context.ready = true;
  setSpeaking(conn, true);
}

function speaking(conn: ConnectionData, d: any) {
  const user_id = BigInt(d.user_id);
  const ssrc = Number(d.ssrc);
  setUserSSRC(conn, user_id, ssrc);
}
function heartbeatACK() {}

function clientDisconnect() {}

function undocumented() {}
