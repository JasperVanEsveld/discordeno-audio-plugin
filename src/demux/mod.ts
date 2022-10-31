import { bufferIter } from "../../utils/buffer.ts";
import { pushIter } from "../../utils/iterator/util/push-iter.ts";

const workerUrl = new URL("./demux-worker.ts", import.meta.url).href;

export function demux(source: AsyncIterable<Uint8Array>) {
  const result = pushIter<Uint8Array>();
  workerDemux(
    source,
    (demuxed) => result.push(demuxed),
    () => result.done()
  );
  return bufferIter(result.getIterator());
}

async function workerDemux(
  source: AsyncIterable<Uint8Array>,
  callback: (demuxed: Uint8Array) => void,
  doneCallback: () => void
) {
  const worker = new Worker(workerUrl, {
    type: "module",
  });
  worker.onmessage = (e) => {
    const { data, done } = e.data;
    if (done) {
      doneCallback();
      return;
    }
    for (const demuxed of data) {
      callback(demuxed);
    }
  };
  for await (const value of source) {
    worker.postMessage({ data: value, done: false });
  }
  worker.postMessage({ done: true });
}
