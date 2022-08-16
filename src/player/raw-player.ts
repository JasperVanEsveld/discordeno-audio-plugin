import { EventSource, wait } from "../../utils/mod.ts";
import { ConnectionData } from "../connection-data.ts";
import { FRAME_DURATION } from "../sample-consts.ts";
import { Player } from "./types.ts";

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

  async play() {
    if (this.playing) {
      return;
    }
    this.playing = true;

    let start = Date.now();
    let packets = 0;
    while (this.playing) {
      const waitTime = packets * FRAME_DURATION - (Date.now() - start);
      if (waitTime < 0 || waitTime > 2 * FRAME_DURATION) {
        start = Date.now();
        packets = 0;
      }
      if (this.#interrupt) {
        const { done, value } = await this.#interrupt.next();
        if (done) {
          this.#interrupt = undefined;
        } else {
          await wait(packets * FRAME_DURATION - (Date.now() - start));
          packets++;
          this.#conn.audio.trigger(value);
          continue;
        }
      }
      const nextAudioIter = await this.#audio?.next();
      if (nextAudioIter === undefined || nextAudioIter.done) {
        this.#audio = undefined;
        this.#doneSource.trigger();
        await this.#onNext();
        continue;
      }
      await wait(packets * FRAME_DURATION - (Date.now() - start));
      packets++;
      this.#conn.audio.trigger(nextAudioIter.value);
    }
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
