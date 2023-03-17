import { IterSource, fromCallback } from "./iterator/mod.ts";

type Listener<T> = (arg: T) => void;

export class BasicSource<T> {
  listeners: Listener<T>[] = [];

  trigger(value: T) {
    for (const listener of this.listeners) {
      listener(value);
    }
  }

  listen(listener: Listener<T>) {
    this.listeners.push(listener);
    return () => {
      this.removeListener(listener);
    };
  }

  removeListener(listener: Listener<T>) {
    const index = this.listeners.indexOf(listener);
    this.listeners.splice(index, 1);
  }

  listenOnce(listener: Listener<T>) {
    const disconnect = this.listen((value) => {
      disconnect();
      listener(value);
    });
  }

  next() {
    return new Promise<T>((resolve) => {
      this.listenOnce(resolve);
    });
  }
}

export class EventSource<T> extends BasicSource<T> {
  iter: IterSource<T>["iterator"];
  disconnect: IterSource<T>["disconnect"];

  constructor() {
    super();
    const { iterator, disconnect } = fromCallback<T>((listener) =>
      this.listen(listener)
    );
    this.iter = iterator;
    this.disconnect = disconnect;
  }
}
