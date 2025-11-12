import { sodium } from "../../deps.ts";

export async function encryptPacket(
    packet: Uint8Array,
    rtp_header: Uint8Array,
    nonce: Uint8Array,
    secret: Uint8Array
) {
    if (!secret) {
        throw "Secret is not known!";
    }
    const key = await crypto.subtle.importKey(
        "raw",
        secret.buffer as ArrayBuffer,
        "AES-GCM",
        true,
        ["encrypt"]
    );
    return await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: nonce.buffer as ArrayBuffer,
            additionalData: rtp_header.buffer as ArrayBuffer,
        },
        key,
        packet.buffer as ArrayBuffer
    );
}

export function decryptPacket(packet: Uint8Array, nonce: Uint8Array, secret: Uint8Array) {
    if (!secret) {
        throw "Secret is not known!";
    }
    return sodium.crypto_aead_aegis256_decrypt(packet, secret, nonce);
}
