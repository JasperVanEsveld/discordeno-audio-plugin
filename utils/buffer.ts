import { EventSource } from "./mod.ts";

export function buffered<T>(iterator: AsyncIterable<T>) {
  const source = new EventSource<T>();
  toCallback(
    iterator,
    (value) => {
      source.trigger(value);
      return value;
    },
    () => {
      source.disconnect();
    }
  );
  return source.iter();
}

async function toCallback<T>(
  iterator: AsyncIterable<T>,
  callback: (value: T) => void,
  done: () => void
) {
  for await (const value of iterator) {
    callback(value);
  }
  done();
}
