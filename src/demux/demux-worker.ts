import { WebmBaseDemuxer } from "./prism.js";

const demuxer = new WebmBaseDemuxer();

// @ts-ignore: Worker stuff
self.onmessage = (event) => {
  const { data, done } = event.data;
  if (done) {
    // @ts-ignore: Worker stuff
    self.postMessage({ done: true });
    return;
  }
  demux(data).then((demuxed) => {
    // @ts-ignore: Worker stuff
    self.postMessage({ data: demuxed, done: false });
  });
};

async function demux(value: Uint8Array) {
  const result = [];
  for await (const demuxed of demuxer.demux(value)) {
    result.push(demuxed);
  }
  return result;
}
