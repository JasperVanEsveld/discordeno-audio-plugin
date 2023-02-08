import { VoiceOpcodes } from "../../deps.ts";

export enum ReceiveVoiceOpcodes {
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
}

export enum SendVoiceOpcodes {
  /** 	Begin a voice websocket connection. */
  Identify = VoiceOpcodes.Identify,
  /** 	Select the voice protocol. */
  SelectProtocol = VoiceOpcodes.SelectProtocol,
  /** Keep the websocket connection alive. */
  Heartbeat = VoiceOpcodes.Heartbeat,
  /** Indicate which users are speaking. */
  Speaking = VoiceOpcodes.Speaking,
  /** Resume a connection. */
  Resume = VoiceOpcodes.Resume,
}
