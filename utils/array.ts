import { clamp } from "./number.ts";

export function arrayEquals<T extends any[], J extends any[]>(a: T, b: J) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

export function asArray<T>(value?: T | T[]): T[] {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? [...value] : [value];
}

export function arrayMove<T>(
  array: T[] | undefined,
  from: number,
  to: number
): T[] {
  const result = spread(array);
  const min = 0;
  const max = result.length;
  clamp(from, min, max);
  clamp(from, min, max);
  result.splice(to, 0, result.splice(from, 1)[0]);
  return result;
}

export function arrayShuffle<T>(array: T[]) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

export function spread<T>(array: T[] | undefined, ...additional: T[]): T[] {
  return [...(array || []), ...additional];
}

export function combine<T>(array: T[] | undefined, add: T[] | undefined): T[] {
  return [...(array || []), ...(add || [])];
}

export function repeat<T>(amount: number, ...value: T[]): T[] {
  let result: T[] = [];
  while (amount > 0) {
    amount--;
    result = [...result, ...value];
  }
  return result;
}

export function remove<T>(array: T[] | undefined, ...toRemove: T[]): T[] {
  const result = spread(array);
  for (const entry of toRemove) {
    const index = result.indexOf(entry);
    result.splice(index, 1);
  }
  return result;
}

export function findRemove<T>(
  array: T[] | undefined,
  equals: (first: T, second: T) => boolean,
  ...toRemove: T[]
): T[] {
  const result = spread(array);
  for (const entry of toRemove) {
    const index = result.findIndex((other) => equals(entry, other));
    result.splice(index, 1);
  }
  return result;
}

export function diff<T>(first: T[], second: T[]): T[] {
  const result = [];
  for (const item of second) {
    if (!first.includes(item)) {
      result.push(item);
    }
  }
  return result;
}
