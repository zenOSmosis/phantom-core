/**
 * IMPORTANT: This file is utilized with a .js extension instead of .ts because
 * the example is not in TypeScript.
 */

import test from "tape";
import PhantomCore, { EVT_READY, EVT_DESTROY } from "../src";

test("basic example", async t => {
  class MyExtension extends PhantomCore {
    constructor() {
      super();

      // Cleanup handlers are invoked in LIFO order by default, so that cleanup handlers can be placed consecutively after certain operations

      this._a = new PhantomCore();
      this.registerCleanupHandler(async () => {
        this.log("Finish the stack cleanup...");

        // Referenced PhantomCore instances must be destructed or disassociated, otherwise a warning will be raised about a potential memory leak
        await this._a.destroy();
      });

      this._b = { echo: 123 };
      this.registerCleanupHandler(() => {
        // Each PhantomCore instance has its own logger
        this.log(
          "Last defined gets cleaned up first, to more easily unwrap the stack on cleanup"
        );

        this._b = null;
      });

      // Asynchronous methods in registerCleanupHandler are awaited upon before
      // the next item's invocation to eliminate race conditions
    }
  }

  // Example implementation
  (async () => {
    const ext = new MyExtension();

    ext.once(EVT_READY, () => {
      ext.log("Ready...");

      // For demonstration
      ext.destroy();
    });

    ext.once(EVT_DESTROY, () => {
      ext.log("Extension destroyed");
    });

    // Log output:
    //
    // [2022-06-14T01:46:52+00:00 info MyExtension 655eba48-892a-4d4d-8f45-a4ab20204679] Ready...
    // [2022-06-14T01:46:52+00:00 info MyExtension 655eba48-892a-4d4d-8f45-a4ab20204679] Extension destroyed
    // [2022-06-14T01:46:52+00:00 info MyExtension 655eba48-892a-4d4d-8f45-a4ab20204679] Do some cleanup work here...
    // [2022-06-14T01:46:52+00:00 info MyExtension 655eba48-892a-4d4d-8f45-a4ab20204679] And some additional cleanup work here...
  })();
});
