import { EventSource } from "../../utils/mod.ts";
import { ConnectionData } from "../connection-data.ts";
import { FRAME_DURATION } from "../sample-consts.ts";
import { Player } from "./types.ts";
import { setDriftlessInterval } from "npm:driftless";
import { sendAudioPacket } from "../mod.ts";

export class RawPlayer implements Player {
  #audio?: AsyncIterableIterator<Uint8Array>;
  #interrupt?: AsyncIterableIterator<Uint8Array>;
  playing = false;
  #conn: ConnectionData;
  #doneSource = new EventSource<void>();

  constructor(conn: ConnectionData) {
    this.#conn = conn;
    setDriftlessInterval(() => this.sendPacket(), FRAME_DURATION);
  }

  setAudio(audio: AsyncIterableIterator<Uint8Array>) {
    this.#audio = audio;
    this.play();
  }

  interrupt(audio?: AsyncIterableIterator<Uint8Array>) {
    this.#interrupt = audio;
  }

  async sendPacket() {
    if (this.playing === false && this.#interrupt === undefined) {
      return;
    }
    if (this.#interrupt) {
      const { done, value } = await this.#interrupt.next();
      if (done) {
        this.#interrupt = undefined;
      } else {
        sendAudioPacket(this.#conn, value);
        return;
      }
    }
    const nextAudioIter = await this.#audio?.next();
    if (nextAudioIter === undefined || nextAudioIter.done) {
      this.#audio = undefined;
      this.playing = false;
      this.#doneSource.trigger();
      return;
    }
    this.#conn.audio.trigger(nextAudioIter.value);
  }

  play() {
    this.playing = true;
  }

  pause() {
    this.playing = false;
  }

  stop() {
    this.pause();
    this.clear();
  }

  clear() {
    this.#doneSource.trigger();
    this.#audio = undefined;
    this.#interrupt = undefined;
  }

  onDone() {
    const promise = new Promise<void>((resolve) => {
      this.#doneSource.addListener(() => {
        resolve();
      });
    });
    return promise;
  }
}
