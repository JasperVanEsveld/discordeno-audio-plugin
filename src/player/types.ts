import { PlayerListener, RawEventTypes } from "./events.ts";

export type Player<T> = {
  playing: boolean;
  play(): void;
  pause(): void;
  stop(): void;
  clear(): void;
  on<J extends RawEventTypes>(event: J, listener: PlayerListener<T, J>): void;
};
