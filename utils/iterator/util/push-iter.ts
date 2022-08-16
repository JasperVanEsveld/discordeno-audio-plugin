export type GetNext<T> = () => Promise<IteratorResult<Awaited<T>, void>>;

export function pushIter<T>() {
  type Value = IteratorResult<T, undefined>;
  const values:Value[] = [];
  let resolvers: ((value: Value) => void)[] = [];
  const pushValue = (value: T) => {
    if (resolvers.length <= 0) {
      values.push({done: false, value});
    }
    for (const resolve of resolvers) {
      resolve({done: false, value});
    }
    resolvers = [];
  };
  const pushDone = () => {
    if (resolvers.length <= 0) {
      values.push({done: true, value: undefined });
    }
    for (const resolve of resolvers) {
      resolve({done: true, value: undefined });
    }
    resolvers = [];
  };
  const pullValue = () => {
    return new Promise<Value>((resolve) => {
      if (values.length > 0) {
        const value = values.shift();
        resolve(value!);
      } else {
        resolvers.push(resolve);
      }
    });
  };
  return {
    push: pushValue,
    done: pushDone,
    getIterator: () => iterFromPull(pullValue),
    getIterNext: (): GetNext<T> => {
      const iter = iterFromPull(pullValue);
      return () => {
        return iter.next();
      };
    },
  };
}

async function* iterFromPull<T>(pullValue: () => Promise<IteratorResult<T, undefined>>) {
  let done;
  while(!done) {
    const result =  await pullValue();
    done = result.done;
    if (!result.done) {
      yield result.value;
    }
  }
}
