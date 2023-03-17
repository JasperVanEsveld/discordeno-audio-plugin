import { BasicSource } from "../../utils/event-source.ts";

export type AllEventTypes = RawEventTypes | QueueEventTypes;
export type RawEventTypes = "next" | "done";
export type QueueEventTypes = "loop";

export type PlayerListener<T, J extends AllEventTypes> = (
  data: EventData<T>[J]
) => void;

type PlayerEvent<T, J extends AllEventTypes> = {
  type: J;
  data: EventData<T>[J];
};
type EventData<T> = {
  next: T;
  done: T;
  loop: T;
};

export class PlayerEventSource<T, K extends AllEventTypes> {
  #source = new BasicSource<PlayerEvent<T, K>>();

  on<J extends K>(event: J, listener: PlayerListener<T, J>) {
    return this.#source.listen((value) => {
      if (value.type === event) {
        listener((value as PlayerEvent<T, J>).data);
      }
    });
  }

  trigger<J extends K>(event: J, data: EventData<T>[J]) {
    this.#source.trigger({ type: event, data });
  }
}
