import { ConnectionData, setUserSSRC } from "../connection-data.ts";
import { discoverIP } from "../udp/discover.ts";
import { setSpeaking } from "../udp/speaking.ts";
import { sendHeart } from "./heartbeat.ts";
import { ReceiveVoiceOpcodes, SendVoiceOpcodes } from "./opcodes.ts";

export const socketHandlers: Record<
    ReceiveVoiceOpcodes,
    (connectionData: ConnectionData, d: any) => void
> = {
    [ReceiveVoiceOpcodes.Ready]: ready,
    [ReceiveVoiceOpcodes.SessionDescription]: sessionDescription,
    [ReceiveVoiceOpcodes.Speaking]: speaking,
    [ReceiveVoiceOpcodes.HeartbeatACK]: heartbeatACK,
    [ReceiveVoiceOpcodes.Hello]: hello,
    [ReceiveVoiceOpcodes.Resumed]: resumed,
    [ReceiveVoiceOpcodes.ClientDisconnect]: clientDisconnect,
};

function hello(conn: ConnectionData, d: { heartbeat_interval: number }) {
    conn.stopHeart = sendHeart(conn, d.heartbeat_interval);
}

function ready(conn: ConnectionData, d: any) {
    const { ssrc, port, ip } = d;
    conn.context.ssrc = ssrc;
    conn.remote = { port, hostname: ip };
    discoverIP(conn, ssrc, ip, port).then((info) => {
        if (conn.ws?.readyState === WebSocket.OPEN) {
            conn.ws.send(
                JSON.stringify({
                    op: SendVoiceOpcodes.SelectProtocol,
                    d: {
                        protocol: "udp",
                        data: {
                            address: info.ip,
                            port: info.port,
                            mode: "aead_aes256_gcm_rtpsize",
                        },
                    },
                })
            );
        }
    });
}

function resumed(conn: ConnectionData) {
    conn.context.ready = true;
    conn.context.reconnect = 0;
    setSpeaking(conn, true);
}

function sessionDescription(conn: ConnectionData, d: any) {
    console.log(d);
    const secret = d.secret_key;
    const mode = d.mode;
    conn.secret = new Uint8Array(secret);
    conn.mode = mode;
    conn.context.ready = true;
    conn.context.reconnect = 0;
    setSpeaking(conn, true);
}

function speaking(conn: ConnectionData, d: any) {
    const user_id = BigInt(d.user_id);
    const ssrc = Number(d.ssrc);
    setUserSSRC(conn, user_id, ssrc);
}

function heartbeatACK(conn: ConnectionData, d: number) {
    if (conn.context.lastHeart === d) {
        conn.context.missedHeart = 0;
        conn.context.lastHeart = undefined;
    }
}

function clientDisconnect() {}
