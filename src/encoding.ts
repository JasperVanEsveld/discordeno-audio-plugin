import { opus } from "../deps.ts";
import { CHANNELS, FRAME_SIZE, SAMPLE_RATE } from "./sample-consts.ts";

const encoder = new opus.Encoder({
  channels: CHANNELS,
  sample_rate: SAMPLE_RATE,
  application: "audio",
});

export function createAudioDecoder() {
  const decoder = new opus.Decoder({
    channels: CHANNELS,
    sample_rate: SAMPLE_RATE,
  });
  let lastTimestamp = 0;
  let last: Uint8Array;
  return (audio: Uint8Array, timestamp: number) => {
    if (lastTimestamp !== timestamp) {
      lastTimestamp = timestamp;
      last = decoder.decode(audio);
    }
    return last;
  };
}

const decoders = new Map<
  number,
  (opus: Uint8Array, timestamp: number) => Uint8Array
>();

function getDecoder(ssrc: number) {
  const decoder = decoders.get(ssrc) || createAudioDecoder();
  decoders.set(ssrc, decoder);
  return decoder;
}

export function decodeAudio(
  audio: Uint8Array,
  ssrc: number,
  timestamp: number
) {
  const decoder = getDecoder(ssrc);
  return decoder(audio, timestamp);
}

export async function* encodePCMAudio(audio: AsyncIterator<Uint8Array>) {
  const gen = encoder.encode_pcm_stream(FRAME_SIZE, audio);
  for await (const frame of gen) {
    yield frame as Uint8Array;
  }
}
