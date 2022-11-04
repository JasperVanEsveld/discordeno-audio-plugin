import { WebmBaseDemuxer } from "./prism.js";

const demuxer = new WebmBaseDemuxer();

// @ts-ignore: Worker stuff
self.onmessage = (event) => {
  const data = event.data;
  demux(data).then((demuxed) => {
    // @ts-ignore: Worker stuff
    self.postMessage(demuxed);
  });
};

async function demux(value: Uint8Array) {
  const result: Uint8Array[] = [];
  for await (const demuxed of demuxer.demux(value)) {
    result.push(demuxed);
  }
  return result;
}
