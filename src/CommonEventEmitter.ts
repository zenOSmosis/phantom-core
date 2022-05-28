import { EventEmitter } from "events";

/**
 * A lightly-wrapped EventEmitter which is compatible with Node.js and
 * browsers.
 */
export default class CommonEventEmitter extends EventEmitter {
  constructor(...args: any[]) {
    super(...args);

    /**
     * "off" method shim for browsers:
     * @see https://github.com/zenOSmosis/phantom-core/pull/17
     */
    if (typeof this.off !== "function") {
      this.off = this.removeListener;
    }
  }
}
