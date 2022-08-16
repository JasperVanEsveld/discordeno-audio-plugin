let lastId = -1n;

export type AudioSource = {
  id: bigint;
  title: string;
  data: () =>
    | Promise<AsyncIterableIterator<Uint8Array>>
    | AsyncIterableIterator<Uint8Array>;
};

export function createAudioSource(
  title: string,
  data: () =>
    | Promise<AsyncIterableIterator<Uint8Array>>
    | AsyncIterableIterator<Uint8Array>
): AudioSource {
  lastId++;
  return {
    id: lastId,
    title,
    data,
  };
}
