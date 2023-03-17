import { assertEquals } from "https://deno.land/std@0.104.0/testing/asserts.ts";
import { arrayMove, arrayShuffle } from "./array.ts";

export class Queue<T> {
  #current: T | undefined;
  #queue: T[] = [];
  #waiting: ((value: T) => void)[] = [];

  clear() {
    const cleared = this.#queue;
    this.#queue = [];
    return cleared;
  }

  current() {
    return this.#current;
  }

  upcoming() {
    return [...this.#queue];
  }

  push(...values: T[]) {
    this.#queue.push(...values);
    for (const waiting of this.#waiting) {
      const value = this.#queue.shift();
      this.#current = value;
      if (value == undefined) {
        break;
      }
      waiting(value);
    }
    this.#waiting = [];
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

  async next() {
    let value = this.#queue.shift();
    this.#current = value;
    if (value === undefined) {
      value = await new Promise<T>((resolve) => {
        this.#waiting.push(resolve);
      });
    }
    return value;
  }
}

Deno.test({
  name: "Test",
  fn: async () => {
    const queue = new Queue<string>();
    const promise0 = queue.next();
    queue.push("Hello");
    queue.push("World!");
    assertEquals("Hello", await promise0);
    assertEquals("World!", await queue.next());
    const promise1 = queue.next();
    const promise2 = queue.next();
    queue.push("Multiple", "Words!");
    assertEquals("Multiple", await promise1);
    assertEquals("Words!", await promise2);
  },
});
