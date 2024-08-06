import { Queue } from "../../utils/mod.ts";
import { AudioSource, LoadSource } from "../audio-source/mod.ts";
import { ConnectionData } from "../connection-data.ts";
import { PlayerEventSource, AllEventTypes, PlayerListener } from "./events.ts";
import { RawPlayer } from "./raw-player.ts";
import { Player } from "./types.ts";

export class QueuePlayer
  extends Queue<AudioSource>
  implements Player<AudioSource>
{
  playing = true;
  looping = false;
  playingSince?: number;
  #rawPlayer: RawPlayer;
  #loadSource: LoadSource;
  #events = new PlayerEventSource<AudioSource, AllEventTypes>();

  constructor(conn: ConnectionData, loadSource: LoadSource) {
    super();
    this.#loadSource = loadSource;
    this.#rawPlayer = new RawPlayer(conn);
    this.playNext();
    this.#rawPlayer.on("done", async () => {
      const current = this.current();
      if (current) {
        this.#events.trigger("done", current);
      }
      await this.playNext();
      if (!this.playing) {
        this.pause();
      }
    });
  }

  async playNext() {
    let song;
    const current = this.current();
    if (this.looping && current !== undefined) {
      song = current;
      this.#events.trigger("loop", song);
    } else {
      song = await super.next();
      this.#events.trigger("next", song);
    }
    this.playingSince = Date.now();
    this.#rawPlayer.setAudio(await song.data());
  }

  clear() {
    return super.clear();
  }

  play() {
    this.playing = true;
    this.#rawPlayer.play();
    return Promise.resolve();
  }

  pause() {
    this.playing = false;
    this.#rawPlayer.pause();
  }

  stop() {
    this.skip();
    this.pause();
  }

  skip() {
    this.looping = false;
    this.#rawPlayer.clear();
  }

  loop(value: boolean) {
    this.looping = value;
  }

  stopInterrupt() {
    this.#rawPlayer.interrupt(undefined);
  }

  /**
   * Listen to events:
   *
   * `next`: New sound started playing
   *
   * `done`: Last sound is done playing
   *
   * `loop`: New loop iteration was started
   * @param event Event to listen to
   * @param listener Triggered on event
   * @returns Function that disconnects the listener
   */
  on<J extends AllEventTypes>(
    event: J,
    listener: PlayerListener<AudioSource, J>
  ) {
    return this.#events.on(event, listener);
  }

  /**
   * Interrupts the current song, resumes when finished
   * @param query Loads a universal song (local file or youtube search)
   */
  async interruptQuery(query: string) {
    for await (const source of await this.#loadSource(query as string)) {
      if (source !== undefined) {
        this.#rawPlayer.interrupt(await source.data());
        break;
      }
    }
  }

  async pushQuery(...queries: string[]) {
    const sources = [];
    for (const query of queries) {
      for await (const source of await this.#loadSource(query as string)) {
        if (source !== undefined) {
          sources.push(source);
          this.push(source);
        }
      }
    }
    return sources;
  }

  async unshiftQuery(...queries: string[]) {
    const sources = [];
    for (const query of queries) {
      for await (const source of await this.#loadSource(query as string)) {
        if (source !== undefined) {
          sources.push(source);
          this.unshift(source);
        }
      }
    }
    return sources;
  }
}
