import { assertEquals } from "https://deno.land/std@0.104.0/testing/asserts.ts";
import { arrayMove, arrayShuffle } from "./array.ts";
import { EventSource } from "./event-source.ts";

export class Queue<T> {
  #current: T | undefined;
  #queue: T[] = [];
  #source = new EventSource<[T]>();
  waiting = false;

  clear() {
    this.#queue = [];
  }

  current() {
    return this.#current;
  }

  upcoming() {
    return [...this.#queue];
  }

  push(...values: T[]) {
    this.#queue.push(...values);
    if (this.waiting) {
      this.triggerNext();
      this.waiting = false;
    }
  }

  unshift(...values: T[]) {
    this.#queue.unshift(...values);
  }

  shuffle() {
    this.#queue = arrayShuffle([...this.#queue]);
  }

  remove(equals: (first: T) => boolean) {
    const original = this.#queue.length;
    this.#queue = [...this.#queue.filter((track) => !equals(track))];
    return original !== this.#queue.length;
  }

  move(position: number, equals: (first: T) => boolean) {
    const queue = this.#queue;
    const from = queue.findIndex((entry) => equals(entry));
    if (from !== -1) {
      this.#queue = arrayMove(queue, from, position);
      return true;
    }
    return false;
  }

  triggerNext() {
    const value = this.#queue.shift();
    this.#current = value;
    if (value === undefined) {
      this.waiting = true;
    } else {
      this.#source.trigger(value);
    }
  }

  stream() {
    return this.#source.iter();
  }
}

Deno.test({
  name: "Test",
  fn: async () => {
    const queue = new Queue<string>();
    queue.push("Hello");
    queue.push("World!");
    const messages = queue.stream();
    queue.triggerNext();
    queue.triggerNext();
    queue.triggerNext();
    queue.triggerNext();
    queue.triggerNext();
    assertEquals("Hello", await messages.nextValue());
    assertEquals("World!", await messages.nextValue());
    assertEquals(undefined, await messages.nextValue());
    assertEquals(undefined, await messages.nextValue());
    assertEquals(undefined, await messages.nextValue());
  },
});
