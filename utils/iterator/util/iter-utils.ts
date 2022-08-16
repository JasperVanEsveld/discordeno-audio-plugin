
export type IterExpanded<T> = ReturnType<typeof addIterUtils<T>>;

export function addIterUtils<T>(values: AsyncIterableIterator<T>) {
  return Object.assign(values, { map, filter, nextValue });
}

async function nextValue<T>(this: AsyncIterableIterator<T>): Promise<T> {
  const result = await this.next();
  return result.value;
}

function map<T, J>(this: AsyncIterableIterator<T>, map: (from: T) => J) {
  const mapGen = async function* (this: AsyncIterableIterator<T>) {
    for await (const value of this) {
      yield map(value);
    }
  };
  return addIterUtils<J>(mapGen.bind(this)());
}

function filter<T>(
  this: AsyncIterableIterator<T>,
  filter: (value: T) => boolean
) {
  const filterGen = async function* (this: AsyncIterableIterator<T>) {
    for await (const value of this) {
      if (filter(value)) {
        yield value;
      }
    }
  };
  const boundFilter = filterGen.bind(this);
  return addIterUtils<T>(boundFilter());
}

// function combine<T, J extends AsyncIterableIterator<any>[]>(
//   this: AsyncIterableIterator<T>,
//   ...others: J
// ) {
//   return combineIter(this, ...others);
// }
