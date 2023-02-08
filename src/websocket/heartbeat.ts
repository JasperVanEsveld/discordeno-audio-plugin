import { VoiceOpcodes } from "../../deps.ts";
import { setDriftlessTimeout } from "npm:driftless";
import { ConnectionData } from "../mod.ts";

function sendHeartBeat(conn: ConnectionData) {
  if (conn.context.lastHeart !== undefined) {
    conn.context.missedHeart++;
  }
  conn.context.lastHeart = Date.now();
  conn.ws?.send(
    JSON.stringify({
      op: VoiceOpcodes.Heartbeat,
      d: conn.context.lastHeart,
    })
  );
}

export function sendHeart(conn: ConnectionData, interval: number) {
  const ws = conn.ws!;
  let last = Date.now();
  if (ws.readyState === WebSocket.OPEN) {
    sendHeartBeat(conn);
  }
  let done = false;
  const repeatBeat = () => {
    if (done || ws.readyState !== WebSocket.OPEN) {
      return;
    }
    if (conn.context.missedHeart >= 3) {
      console.log("Missed too many heartbeats, attempting reconnect");
      ws.close();
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
