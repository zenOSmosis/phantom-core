import test from "tape";
import PhantomCore, { EVT_READY, EVT_DESTROY } from "../src";

test("basic example", async t => {
  class MyExtension extends PhantomCore {
    constructor() {
      super();

      // Cleanup handlers are invoked in LIFO order by default

      this.registerCleanupHandler(() => {
        this.log("And some additional cleanup work here...");
      });

      this.registerCleanupHandler(() => {
        // PhantomCore has its own logger, and the log level is configurable per
        // instance. It's currently a wrapper around the Console log methods, has
        // a custom prefix, and retains the original stack trace.
        this.log("Do some cleanup work here...");
      });

      // Asynchronous methods in registerCleanupHandler are executed awaited upon
      // as if they were run synchronously, to eliminate race conditions
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
      // Outside of an instance, the global logger can be used
      ext.log("Extension destroyed");
    });

    // Destruct logs are rendered in the following order:
    //
    // [2022-06-14T01:46:52+00:00 info MyExtension 655eba48-892a-4d4d-8f45-a4ab20204679] Ready...
    // [2022-06-14T01:46:52+00:00 info MyExtension 655eba48-892a-4d4d-8f45-a4ab20204679] Extension destroyed
    // [2022-06-14T01:46:52+00:00 info MyExtension 655eba48-892a-4d4d-8f45-a4ab20204679] Do some cleanup work here...
    // [2022-06-14T01:46:52+00:00 info MyExtension 655eba48-892a-4d4d-8f45-a4ab20204679] And some additional cleanup work here...
  })();
});
