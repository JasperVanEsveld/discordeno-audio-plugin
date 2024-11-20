import { ConnectionData } from "../connection-data.ts";
import { SendVoiceOpcodes } from "../websocket/opcodes.ts";

export function setSpeaking(
  { ws, context }: ConnectionData,
  speaking: boolean,
) {
  if (context.speaking === speaking || ws?.readyState !== WebSocket.OPEN) {
    return;
  }
  context.speaking = speaking;
  ws?.send(
    JSON.stringify({
      op: SendVoiceOpcodes.Speaking,
      d: {
        speaking: speaking ? 1 : 0,
        delay: 0,
        ssrc: context.ssrc,
      },
    }),
  );
}
