import { VoiceOpcodes } from "../../deps.ts";
import { setDriftlessTimeout } from "npm:driftless";

function createHeartBeat(time: number) {
  return JSON.stringify({
    op: VoiceOpcodes.Heartbeat,
    d: time,
  });
}

export function sendHeart(ws: WebSocket, interval: number) {
  let last = Date.now();
  let timestamp = 0;
  const heartbeat = createHeartBeat(timestamp);
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(heartbeat);
  }
  let done = false;
  const repeatBeat = () => {
    if (done || ws.readyState !== WebSocket.OPEN) {
      return;
    }
    timestamp += interval;
    const heartbeat = createHeartBeat(timestamp);
    last = Date.now();
    ws.send(heartbeat);
    setDriftlessTimeout(repeatBeat, interval + (last - Date.now()));
  };
  setDriftlessTimeout(repeatBeat, interval + (last - Date.now()));
  return () => {
    done = true;
  };
}
