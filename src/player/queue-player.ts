import { Queue } from "../../utils/mod.ts";
import { AudioSource, LoadSource } from "../audio-source/mod.ts";
import { ConnectionData } from "../connection-data.ts";
import { RawPlayer } from "./raw-player.ts";
import { Player } from "./types.ts";

export class QueuePlayer extends Queue<AudioSource> implements Player {
  playing = false;
  looping = false;
  playingSince?: number;
  #rawPlayer: RawPlayer;
  #loadSource: LoadSource;

  constructor(conn: ConnectionData, loadSource: LoadSource) {
    super();
    this.#loadSource = loadSource;
    this.#rawPlayer = new RawPlayer(conn);
    this.#startQueue();
    this.playing = true;
    super.waiting = true;
  }

  async #setSong(song: AudioSource) {
    this.playingSince = Date.now();
    this.#rawPlayer.setAudio(await song.data());
    await this.#rawPlayer.onDone();
    if (this.looping) {
      this.#setSong(song);
    } else {
      this.triggerNext();
    }
  }

  async #startQueue() {
    for await (const [song] of this.stream()) {
      await this.#setSong(song);
    }
  }

  play() {
    this.#rawPlayer.play();
    this.playing = true;
    return Promise.resolve();
  }

  pause() {
    this.playing = false;
    this.#rawPlayer.pause();
  }

  stop() {
    this.playingSince = undefined;
    this.#rawPlayer.clear();
    this.pause();
  }

  skip() {
    this.#rawPlayer.clear();
  }

  loop(value: boolean) {
    this.looping = value;
  }

  stopInterrupt() {
    this.#rawPlayer.interrupt(undefined);
  }

  interrupt(audio: AsyncIterableIterator<Uint8Array>) {
    this.#rawPlayer.interrupt(audio);
  }

  /**
   * Interrupts the current song, resumes when finished
   * @param query Loads a universal song (local file or youtube search)
   */
  async interruptQuery(query: string) {
    const sources = await this.#loadSource(query as string);
    this.#rawPlayer.interrupt(await sources[0].data());
  }

  async pushQuery(...queries: string[]) {
    const sources = [];
    for (const query of queries) {
      sources.push(...(await this.#loadSource(query as string)));
      this.push(...sources);
    }
    return sources;
  }

  async unshiftQuery(...queries: string[]) {
    const sources = [];
    for (const query of queries) {
      sources.push(...(await this.#loadSource(query as string)));
      this.unshift(...sources);
    }
    return sources;
  }
}
