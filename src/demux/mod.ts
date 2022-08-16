import { WebmBaseDemuxer } from "./prism.js";

export async function* demux(source: AsyncIterable<Uint8Array>) {
  const demuxer = new WebmBaseDemuxer();
  for await (const value of source) {
    for await (const demuxed of demuxer.demux(value)) {
      yield demuxed;
    }
  }
}
