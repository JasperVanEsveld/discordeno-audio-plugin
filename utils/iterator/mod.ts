import { pushIter, addIterUtils } from "./util/mod.ts";

type Listener<T> = { push: (arg: T) => void; done: () => void };
export type IterSource<T> = ReturnType<typeof fromCallback<T>>;

export function fromCallback<T>(
  source: (listener: (value: T) => void) => void,
  disconnect?: () => void
) {
  let isDone = false;
  let listeners: Listener<T>[] = [];

  function trigger(value: T) {
    if (isDone) {
      return;
    }
    for (const listener of listeners) {
      listener.push(value);
    }
  }
  source(trigger);

  function done() {
    disconnect?.();
    if (isDone) {
      return;
    }
    for (const listener of listeners) {
      listener.done();
    }
    listeners = [];
    isDone = true;
  }

  function addListener(listener: Listener<T>) {
    listeners.push(listener);
    return () => {
      removeListener(listener);
    };
  }

  function removeListener(listener: Listener<T>) {
    const index = listeners.indexOf(listener);
    listeners.splice(index, 1);
  }

  return {
    iterator: () => {
      const { push, done, getIterator } = pushIter<T>();
      addListener({ push, done });
      return addIterUtils<T>(getIterator());
    },
    disconnect: done,
  };
}
