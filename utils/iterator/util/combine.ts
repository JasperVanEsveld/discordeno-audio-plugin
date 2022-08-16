// import { EventSource } from "../event-source.ts";

// type CombineReturn<J> = J extends AsyncIterableIterator<infer I>[]
//   ? I
//   : unknown;

// export function combineIter<J extends AsyncIterableIterator<any>[]>(
//   ...iterators: J
// ) {
//   const source = new EventSource<CombineReturn<J>>();
//   const handler = (value: CombineReturn<J>) => {
//     source.trigger(value);
//   };
//   iterators.forEach(async (iterator) => {
//     for await (const value of iterator) {
//       handler(value);
//     }
//   });
//   return source.stream();
// }
