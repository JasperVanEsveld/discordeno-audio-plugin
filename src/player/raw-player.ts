import { ConnectionData } from "../connection-data.ts";
import { FRAME_DURATION } from "../sample-consts.ts";
import { Player } from "./types.ts";
import { setDriftlessInterval, clearDriftless } from "npm:driftless";
import { PlayerEventSource, RawEventTypes, PlayerListener } from "./events.ts";

export class RawPlayer implements Player<AsyncIterableIterator<Uint8Array>> {
  #audio?: AsyncIterableIterator<Uint8Array>;
  #interrupt?: AsyncIterableIterator<Uint8Array>;
  playing = false;
  #conn: ConnectionData;
  #events = new PlayerEventSource<
    AsyncIterableIterator<Uint8Array>,
    RawEventTypes
  >();

  constructor(conn: ConnectionData) {
    this.#conn = conn;
  }

  play() {
    if (this.playing) {
      return;
    }
    this.playing = true;

    const inter = setDriftlessInterval(async () => {
      if (this.playing === false) {
        clearDriftless(inter);
        return;
      }
      const frame = await this.#getFrame();
      if (frame === undefined) {
        return;
      }
      this.#conn.audio.trigger(frame);
    }, FRAME_DURATION);
  }

  pause() {
    this.playing = false;
  }

  stop() {
    this.clear();
    this.pause();
  }

  clear() {
    if (this.#audio) {
      this.#events.trigger("done", this.#audio);
    }
    this.#audio = undefined;
    this.#interrupt = undefined;
  }

  setAudio(audio: AsyncIterableIterator<Uint8Array>) {
    this.#audio = audio;
    this.#events.trigger("next", audio);
    this.play();
  }

  interrupt(audio?: AsyncIterableIterator<Uint8Array>) {
    this.#interrupt = audio;
    if (!this.playing) {
      this.play();
    }
  }

  on<J extends RawEventTypes>(
    event: J,
    listener: PlayerListener<AsyncIterableIterator<Uint8Array>, J>
  ): void {
    this.#events.on(event, listener);
  }

  async #getFrame() {
    const interrupt = await this.#getNextFrame(this.#interrupt);
    if (interrupt !== undefined) {
      return interrupt;
    }
    const audio = await this.#getNextFrame(this.#audio);
    if (audio === undefined) {
      this.#handleAudioStopped();
    }
    return audio;
  }

  async #getNextFrame(source: AsyncIterableIterator<Uint8Array> | undefined) {
    const nextResult = await source?.next();
    return nextResult !== undefined && !nextResult?.done
      ? nextResult.value
      : undefined;
  }

  #handleAudioStopped() {
    if (this.#audio !== undefined) {
      this.#events.trigger("done", this.#audio);
    }
    this.#audio = undefined;
    this.playing = false;
  }
}
