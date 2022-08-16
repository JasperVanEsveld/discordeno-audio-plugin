export type Player = {
  playing: boolean;
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  clear(): void;
  interrupt(audio: AsyncIterableIterator<Uint8Array>): void;
};
