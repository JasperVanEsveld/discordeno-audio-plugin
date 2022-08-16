import { IterSource, fromCallback } from "./iterator/mod.ts";
import { Arr } from "./types.ts";

type Listener<T extends Arr> = (...arg: T) => void;

export class EventSource<T extends Arr> {
  listeners: Listener<T>[] = [];
  iter: IterSource<T>["iterator"];
  disconnect: IterSource<T>["disconnect"];

  constructor() {
    const { iterator, disconnect } = fromCallback<T>((listener) =>
      this.addListener(listener)
    );
    this.iter = iterator;
    this.disconnect = disconnect;
  }

  trigger(...arg: T) {
    for (const listener of this.listeners) {
      listener(...arg);
    }
  }

  addListener(listener: Listener<T>) {
    this.listeners.push(listener);
    return () => {
      this.removeListener(listener);
    };
  }

  removeListener(listener: Listener<T>) {
    const index = this.listeners.indexOf(listener);
    this.listeners.splice(index, 1);
  }
}
