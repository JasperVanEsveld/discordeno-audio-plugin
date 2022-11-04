import { EventSource } from "../../utils/mod.ts";
import { ConnectionData } from "../connection-data.ts";
import { FRAME_DURATION } from "../sample-consts.ts";
import { Player } from "./types.ts";
import { setDriftlessInterval, clearDriftless } from "npm:driftless";

export class RawPlayer implements Player {
  #audio?: AsyncIterableIterator<Uint8Array>;
  #interrupt?: AsyncIterableIterator<Uint8Array>;
  playing = false;
  #conn: ConnectionData;
  #doneSource = new EventSource<[]>();
  #nextSource = new EventSource<[]>();
  #onNext = () => this.#nextSource.iter().nextValue();

  constructor(conn: ConnectionData) {
    this.#conn = conn;
    this.play();
  }

  setAudio(audio: AsyncIterableIterator<Uint8Array>) {
    this.#audio = audio;
    this.#nextSource.trigger();
  }

  interrupt(audio?: AsyncIterableIterator<Uint8Array>) {
    this.#interrupt = audio;
    if (this.#audio === undefined) {
      this.#nextSource.trigger();
    }
  }

  play() {
    if (this.playing) {
      return;
    }
    this.playing = true;

    const inter = setDriftlessInterval(async () => {
      if (this.playing === false) {
        clearDriftless(inter);
      }
      if (this.#interrupt) {
        const { done, value } = await this.#interrupt.next();
        if (done) {
          this.#interrupt = undefined;
        } else {
          this.#conn.audio.trigger(value);
          return;
        }
      }
      const nextAudioIter = await this.#audio?.next();
      if (nextAudioIter === undefined || nextAudioIter.done) {
        this.#audio = undefined;
        this.#doneSource.trigger();
        await this.#onNext();
        return;
      }
      this.#conn.audio.trigger(nextAudioIter.value);
    }, FRAME_DURATION);
  }

  pause() {
    this.playing = false;
  }

  stop() {
    this.pause();
    this.clear();
  }

  clear() {
    this.#audio = undefined;
    this.#interrupt = undefined;
  }

  async onDone() {
    await this.#doneSource.iter().nextValue();
  }
}
