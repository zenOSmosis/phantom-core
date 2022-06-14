import { EventEmitter } from "events";

export type EventName = string | symbol;
export type EventMap = Map<EventName, EventListener>;

/**
 * A callback which is invoked after the connected event has emit.
 *
 * FIXME: (jh) [Even before renaming] I tried to import this from
 * DefinitelyTyped but could not get the type to pick up:
 * @see https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/events/index.d.ts
 *
 * Possible related issue:
 * @see https://github.com/microsoft/TypeScript/issues/32205
 */
export type EventListener = (...args: any[]) => void;

/**
 * A lightly-wrapped EventEmitter which is compatible with Node.js and
 * browsers.
 */
export default class CommonEventEmitter extends EventEmitter {
  constructor() {
    super();

    /**
     * "off" method shim for browsers:
     * @see https://github.com/zenOSmosis/phantom-core/pull/17
     */
    if (typeof this.off !== "function") {
      this.off = this.removeListener;
    }
  }
}
