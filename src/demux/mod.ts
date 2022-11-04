const workerUrl = new URL("./demux-worker.ts", import.meta.url).href;

export async function* demux(source: AsyncIterable<Uint8Array>) {
  const worker = new Worker(workerUrl, {
    type: "module",
  });
  for await (const value of source) {
    const nextValue = new Promise<Uint8Array[]>((resolve) => {
      worker.onmessage = (e) => {
        resolve(e.data);
      };
    });
    worker.postMessage(value);
    for (const demuxed of await nextValue) {
      yield demuxed;
    }
  }
  worker.terminate();
}
