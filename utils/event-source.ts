type Listener<T> = (arg: T) => void;

export class EventSource<T> {
  listeners: Listener<T>[] = [];

  trigger(arg: T) {
    for (const listener of this.listeners) {
      listener(arg);
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
