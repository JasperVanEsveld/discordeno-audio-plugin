export async function* bufferIter<T>(
  iterator: AsyncIterableIterator<T>,
  size = 10
) {
  const buffer: T[] = [];
  for (let i = 0; i < size; i++) {
    const result = await iterator.next();
    if (result.done) {
      break;
    } else {
      buffer.push(result.value);
    }
  }
  let done = false;
  while (!done || buffer.length > 0) {
    if (buffer.length > 0) {
      yield buffer.shift()!;
      iterator.next().then((result) => {
        if (result.done) {
          done = true;
        } else {
          buffer.push(result.value);
        }
      });
    } else {
      const result = await iterator.next();
      if (result.done) {
        return;
      } else {
        yield result.value;
      }
    }
  }
}
