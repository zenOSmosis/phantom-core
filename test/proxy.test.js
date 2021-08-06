const test = require("tape-async");
const { EventEmitter } = require("events");
const PhantomCore = require("../src");
const { EVT_UPDATED } = PhantomCore;

test("proxy events", async t => {
  t.plan(11);

  const phantom1 = new PhantomCore();
  const phantom2 = new PhantomCore();

  t.throws(
    () => {
      phantom1.proxyOn(new EventEmitter(), EVT_UPDATED, () =>
        // NOTE: Not throwing here because we want to make sure it comes from the class
        console.log("Should not get here")
      );
    },
    ReferenceError,
    "proxyOn cannot proxy to non-PhantomCore instance"
  );

  t.throws(
    () => {
      phantom1.proxyOn(phantom1, EVT_UPDATED, () =>
        // NOTE: Not throwing here because we want to make sure it comes from the class
        console.log("Should not get here")
      );
    },
    ReferenceError,
    "proxyOn cannot proxy to same PhantomCore instance"
  );

  t.throws(
    () => {
      phantom1.proxyOnce(new EventEmitter(), EVT_UPDATED, () =>
        // NOTE: Not throwing here because we want to make sure it comes from the class
        console.log("Should not get here")
      );
    },
    ReferenceError,
    "proxyOnce cannot proxy to non-PhantomCore instance"
  );

  t.throws(
    () => {
      phantom1.proxyOnce(phantom1, EVT_UPDATED, () =>
        // NOTE: Not throwing here because we want to make sure it comes from the class
        console.log("Should not get here")
      );
    },
    ReferenceError,
    "proxyOnce cannot proxy to same PhantomCore instance"
  );

  t.throws(
    () => {
      phantom1.proxyOff(new EventEmitter(), EVT_UPDATED, () =>
        // NOTE: Not throwing here because we want to make sure it comes from the class
        console.log("Should not get here")
      );
    },
    ReferenceError,
    "proxyOff cannot proxy to non-PhantomCore instance"
  );

  t.throws(
    () => {
      phantom1.proxyOff(phantom1, EVT_UPDATED, () =>
        // NOTE: Not throwing here because we want to make sure it comes from the class
        console.log("Should not get here")
      );
    },
    ReferenceError,
    "proxyOff cannot proxy to same PhantomCore instance"
  );

  // Test multiple iterations against proxyOn
  t.doesNotThrow(
    async () => {
      let iterations = 0;

      await Promise.all([
        new Promise(resolve =>
          phantom2.proxyOn(phantom1, EVT_UPDATED, () => {
            ++iterations;

            if (iterations === 2) {
              resolve();
            }
          })
        ),
      ]);
    },
    Error,
    "proxyOn binds event listener"
  );

  // Ensure multiple iterations can't be emit w/ proxyOnce
  t.doesNotThrow(
    async () => {
      let hasEmit = false;

      await Promise.all([
        new Promise((resolve, reject) =>
          phantom2.proxyOnce(phantom1, EVT_UPDATED, () => {
            if (hasEmit) {
              throw new Error("proxyOnce cannot emit more than once");
            }

            hasEmit = true;

            resolve();
          })
        ),

        // Allow one second for previous promise to try to be invoked again (which it shouldn't w/ proxyOnce)
        new Promise(resolve => {
          setTimeout(() => resolve, 1000);
        }),

        new Promise(resolve => {
          for (let i = 0; i < 2; i++) {
            phantom1.emit(EVT_UPDATED);
          }

          resolve();
        }),
      ]);
    },
    Error,
    "proxyOnce binds event listener"
  );

  t.doesNotThrow(
    () => {
      const _eventHandler = () => {
        throw new Error("proxyOff is not working as expected");
      };

      phantom2.proxyOn(phantom1, EVT_UPDATED, _eventHandler);
      phantom2.proxyOff(phantom1, EVT_UPDATED, _eventHandler);

      phantom1.emit(EVT_UPDATED);
    },
    Error,
    "proxyOff unbinds event listener when bound w/ proxyOn"
  );

  t.doesNotThrow(
    () => {
      const _eventHandler = () => {
        throw new Error("proxyOff is not working as expected");
      };

      phantom2.proxyOnce(phantom1, EVT_UPDATED, _eventHandler);
      phantom2.proxyOff(phantom1, EVT_UPDATED, _eventHandler);

      phantom1.emit(EVT_UPDATED);
    },
    Error,
    "proxyOff unbinds event listener when bound w/ proxyOnce"
  );

  t.doesNotThrow(async () => {
    await Promise.all([phantom1.destroy(), phantom2.destroy()]);
  }, "successfully destructs PhantomCore after proxying");

  t.end();
});
