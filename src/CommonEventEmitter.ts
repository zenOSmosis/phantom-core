import { EventEmitter } from "events";
import { Primitive, RecursiveObject } from "./types";

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
