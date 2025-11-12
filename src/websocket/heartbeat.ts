import { setDriftlessTimeout } from "npm:driftless";
import { ConnectionData } from "../mod.ts";
import { SendVoiceOpcodes } from "./opcodes.ts";

function sendHeartBeat(conn: ConnectionData) {
    if (conn.context.lastHeart !== undefined) {
        conn.context.missedHeart++;
    }
    conn.context.lastHeart = Date.now();
    conn.ws?.send(
        JSON.stringify({
            op: SendVoiceOpcodes.Heartbeat,
            d: {
                t: conn.context.lastHeart,
            },
        })
    );
}

export function sendHeart(conn: ConnectionData, interval: number) {
    let last = Date.now();
    if (conn.ws?.readyState === WebSocket.OPEN) {
        sendHeartBeat(conn);
    }
    let done = false;
    const repeatBeat = () => {
        if (done || conn.ws?.readyState !== WebSocket.OPEN) {
            return;
        }
        if (conn.context.missedHeart >= 3) {
            console.log("Missed too many heartbeats, attempting reconnect");
            conn.ws?.close();
            return;
        }
        last = Date.now();
        sendHeartBeat(conn);
        setDriftlessTimeout(repeatBeat, interval + (last - Date.now()));
    };
    setDriftlessTimeout(repeatBeat, interval + (last - Date.now()));
    return () => {
        done = true;
    };
}
