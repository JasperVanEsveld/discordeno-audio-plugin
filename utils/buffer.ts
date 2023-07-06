import { EventSource } from "./mod.ts";

export function buffered<T>(iterator: AsyncIterableIterator<T>) {
  const source = new EventSource<T>();
  toCallback(iterator, (value) => {
    source.trigger(value);
    return value;
  });
  return source.iter();
}

async function toCallback<T>(
  iterator: AsyncIterableIterator<T>,
  callback: (value: T) => unknown
) {
  for await (const value of iterator) {
    callback(value);
  }
}
