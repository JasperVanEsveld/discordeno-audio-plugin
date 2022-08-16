import { secretbox } from "../../deps.ts";

export function encryptPacket(
  secret: Uint8Array,
  packet: Uint8Array,
  nonce: Uint8Array
) {
  if (!secret) {
    throw "Secret is not known!";
  }
  return secretbox.seal(packet, secret, nonce);
}

export function decryptPacket(
  secret: Uint8Array,
  packet: Uint8Array,
  nonce: Uint8Array
) {
  if (!secret) {
    throw "Secret is not known!";
  }
  return secretbox.open(packet, secret, nonce);
}
