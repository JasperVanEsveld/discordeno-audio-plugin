import { ConnectionData } from "../connection-data.ts";
import { FRAME_SIZE } from "../sample-consts.ts";
import { decryptPacket, encryptPacket } from "./code-and-crypt.ts";

export function stripRTP(conn: ConnectionData, packet: Uint8Array) {
  const dataView = new DataView(packet.buffer);
  const rtp = {
    version: dataView.getUint8(0),
    type: dataView.getUint8(1),
    sequence: dataView.getUint16(2, false),
    timestamp: dataView.getUint32(4, false),
    ssrc: dataView.getUint32(8, false),
  };
  if (!conn.secret) {
    throw "Secret is not known!";
  }

  const nonce = new Uint8Array([...packet.slice(0, 12), ...new Uint8Array(12)]);
  const encrypted = packet.slice(12, packet.length);
  let data = decryptPacket(conn.secret, encrypted, nonce);

  const view = new DataView(data.buffer);
  if (data[0] === 0xbe && data[1] === 0xde && data.length > 4) {
    const length = view.getUint16(2, false);
    // let offset = 4;
    // for (let i = 0; i < length; i++) {
    //   const byte = view.getUint8(offset);
    //   if (byte === 0) continue;
    //   offset += 1 + (byte & 15);
    // }
    if (length === 1) {
      data = data.slice(8); // IDK when actually calculating it should be 6 offset but it is 8...
    }
  }
  return { rtp, nonce, data };
}

export function addRTP(conn: ConnectionData, packet: Uint8Array) {
  const {
    secret,
    context: { sequence, timestamp, ssrc },
  } = conn;
  if (!ssrc) {
    throw "SSRC is not known!";
  }
  if (!secret) {
    throw "Secret is not known!";
  }
  const rtp = new Uint8Array(12);
  const rtpView = new DataView(rtp.buffer);
  rtpView.setUint8(0, 0x80);
  rtpView.setUint8(1, 0x78);
  rtpView.setUint16(2, sequence, false);
  rtpView.setUint32(4, timestamp, false);
  rtpView.setUint32(8, ssrc, false);

  const nonce = new Uint8Array([...rtp, ...new Uint8Array(12)]);

  const encrypted = encryptPacket(secret, packet, nonce);
  return new Uint8Array([...rtp, ...encrypted]);
}

export function incrementAudioMetaData(context: ConnectionData["context"]) {
  context.sequence++;
  context.timestamp += FRAME_SIZE;
  context.sequence %= 2 ** 16;
  context.timestamp %= 2 ** 32;
}

export async function sendAudioPacket(conn: ConnectionData, audio: Uint8Array) {
  if (!conn || !conn.udpSocket || !conn.remote || !conn.context.ready) {
    return;
  }
  incrementAudioMetaData(conn.context);
  try {
    const packet = addRTP(conn, audio);
    await conn.udpSocket.send(packet, {
      ...conn.remote,
      transport: "udp",
    });
  } catch (error) {
    console.log(`Packet not send, ${error}`);
  }
}
