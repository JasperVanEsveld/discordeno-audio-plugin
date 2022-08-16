import { VoiceOpcodes } from "../../deps.ts";
import { ConnectionData } from "../connection-data.ts";

export function setSpeaking(
  { ws, context }: ConnectionData,
  speaking: boolean
) {
  if (context.speaking === speaking || ws?.readyState !== WebSocket.OPEN) {
    return;
  }
  context.speaking = speaking;
  ws?.send(
    JSON.stringify({
      op: VoiceOpcodes.Speaking,
      d: {
        speaking: speaking ? 1 : 0,
        delay: 0,
        ssrc: context.ssrc,
      },
    })
  );
}
