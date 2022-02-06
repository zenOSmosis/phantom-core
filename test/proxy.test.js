const test = require("tape");
const { EventEmitter } = require("events");
const PhantomCore = require("../src");
const { EVT_UPDATED } = PhantomCore;

// TODO: Ensure that events are added to the other instances, and not to the local

test("basic proxy events", async t => {
  t.plan(11);

  const p1 = new PhantomCore();
  const p2 = new PhantomCore();

  t.throws(
    () => {
      p1.proxyOn(new EventEmitter(), EVT_UPDATED, () =>
        // NOTE: Not throwing here because we want to make sure it comes from the class
        console.log("Should not get here")
      );
    },
    ReferenceError,
    "proxyOn cannot proxy to non-PhantomCore instance"
  );

  t.throws(
    () => {
      p1.proxyOn(p1, EVT_UPDATED, () =>
        // NOTE: Not throwing here because we want to make sure it comes from the class
        console.log("Should not get here")
      );
    },
    ReferenceError,
    "proxyOn cannot proxy to same PhantomCore instance"
  );

  t.throws(
    () => {
      p1.proxyOnce(new EventEmitter(), EVT_UPDATED, () =>
        // NOTE: Not throwing here because we want to make sure it comes from the class
        console.log("Should not get here")
      );
    },
    ReferenceError,
    "proxyOnce cannot proxy to non-PhantomCore instance"
  );

  t.throws(
    () => {
      p1.proxyOnce(p1, EVT_UPDATED, () =>
        // NOTE: Not throwing here because we want to make sure it comes from the class
        console.log("Should not get here")
      );
    },
    ReferenceError,
    "proxyOnce cannot proxy to same PhantomCore instance"
  );

  t.throws(
    () => {
      p1.proxyOff(new EventEmitter(), EVT_UPDATED, () =>
        // NOTE: Not throwing here because we want to make sure it comes from the class
        console.log("Should not get here")
      );
    },
    ReferenceError,
    "proxyOff cannot proxy to non-PhantomCore instance"
  );

  t.throws(
    () => {
      p1.proxyOff(p1, EVT_UPDATED, () =>
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
          p2.proxyOn(p1, EVT_UPDATED, () => {
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
          p2.proxyOnce(p1, EVT_UPDATED, () => {
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
            p1.emit(EVT_UPDATED);
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

      p2.proxyOn(p1, EVT_UPDATED, _eventHandler);
      p2.proxyOff(p1, EVT_UPDATED, _eventHandler);

      p1.emit(EVT_UPDATED);
    },
    Error,
    "proxyOff unbinds event listener when bound w/ proxyOn"
  );

  t.doesNotThrow(
    () => {
      const _eventHandler = () => {
        throw new Error("proxyOff is not working as expected");
      };

      p2.proxyOnce(p1, EVT_UPDATED, _eventHandler);
      p2.proxyOff(p1, EVT_UPDATED, _eventHandler);

      p1.emit(EVT_UPDATED);
    },
    Error,
    "proxyOff unbinds event listener when bound w/ proxyOnce"
  );

  t.doesNotThrow(async () => {
    await Promise.all([p1.destroy(), p2.destroy()]);
  }, "successfully destructs PhantomCore after proxying");

  t.end();
});

test("proxy unregistration", async t => {
  // TODO: Implement plan

  // on / off
  await (async () => {
    const p1 = new PhantomCore();
    const p2 = new PhantomCore();

    const _eventHandlerA = () => {
      throw new Error("should not be invoked");
    };

    const _eventHandlerB = () => {
      throw new Error("should not be invoked");
    };

    const _eventHandlerC = () => {
      throw new Error("should not be invoked");
    };

    p1.proxyOn(p2, EVT_UPDATED, _eventHandlerA);
    p1.proxyOn(p2, EVT_UPDATED, _eventHandlerB);
    p1.proxyOn(p2, "some-test-event", _eventHandlerC);

    t.ok(
      p1._proxyBinds.onListeners.length === 3,
      "three registered on proxy listeners bound on p1"
    );

    t.deepEquals(p1._proxyBinds.onListeners, [
      {
        proxyInstance: p2,
        eventName: "updated",
        eventHandler: _eventHandlerA,
      },
      {
        proxyInstance: p2,
        eventName: "updated",
        eventHandler: _eventHandlerB,
      },
      {
        proxyInstance: p2,
        eventName: "some-test-event",
        eventHandler: _eventHandlerC,
      },
    ]);

    p1.proxyOff(p2, EVT_UPDATED, _eventHandlerB);

    t.deepEquals(p1._proxyBinds.onListeners, [
      {
        proxyInstance: p2,
        eventName: "updated",
        eventHandler: _eventHandlerA,
      },
      {
        proxyInstance: p2,
        eventName: "some-test-event",
        eventHandler: _eventHandlerC,
      },
    ]);

    t.equals(
      p1._proxyBinds.onListeners.length,
      2,
      "two registered on proxy listeners bound on p1"
    );
  })();

  // once / off
  await (async () => {
    const p1 = new PhantomCore();
    const p2 = new PhantomCore();

    const _eventHandlerA = () => {
      throw new Error("should not be invoked");
    };

    const _eventHandlerB = () => {
      throw new Error("should not be invoked");
    };

    const _eventHandlerC = () => {
      throw new Error("should not be invoked");
    };

    p1.proxyOnce(p2, EVT_UPDATED, _eventHandlerA);
    p1.proxyOnce(p2, EVT_UPDATED, _eventHandlerB);
    p1.proxyOnce(p2, "some-test-event", _eventHandlerC);

    t.equals(
      p1._proxyBinds.onceListeners.length,
      3,
      "three registered once proxy listeners bound on p1"
    );

    t.deepEquals(p1._proxyBinds.onceListeners, [
      {
        proxyInstance: p2,
        eventName: "updated",
        eventHandler: _eventHandlerA,
      },
      {
        proxyInstance: p2,
        eventName: "updated",
        eventHandler: _eventHandlerB,
      },
      {
        proxyInstance: p2,
        eventName: "some-test-event",
        eventHandler: _eventHandlerC,
      },
    ]);

    p1.proxyOff(p2, EVT_UPDATED, _eventHandlerB);

    t.deepEquals(p1._proxyBinds.onceListeners, [
      {
        proxyInstance: p2,
        eventName: "updated",
        eventHandler: _eventHandlerA,
      },
      {
        proxyInstance: p2,
        eventName: "some-test-event",
        eventHandler: _eventHandlerC,
      },
    ]);

    t.equals(
      p1._proxyBinds.onceListeners.length,
      2,
      "two registered once proxy listeners bound on p1"
    );
  })();

  // on / destroy
  await (async () => {
    const p1 = new PhantomCore();
    const p2 = new PhantomCore();

    const _eventHandlerA = () => {
      throw new Error("should not be invoked");
    };

    const _eventHandlerB = () => {
      throw new Error("should not be invoked");
    };

    const _eventHandlerC = () => {
      throw new Error("should not be invoked");
    };

    p1.proxyOn(p2, EVT_UPDATED, _eventHandlerA);
    p1.proxyOn(p2, EVT_UPDATED, _eventHandlerB);
    p1.proxyOn(p2, "some-test-event", _eventHandlerC);

    t.ok(
      p1._proxyBinds.onListeners.length === 3,
      "three registered on proxy listeners bound on p1"
    );

    t.deepEquals(p1._proxyBinds.onListeners, [
      {
        proxyInstance: p2,
        eventName: "updated",
        eventHandler: _eventHandlerA,
      },
      {
        proxyInstance: p2,
        eventName: "updated",
        eventHandler: _eventHandlerB,
      },
      {
        proxyInstance: p2,
        eventName: "some-test-event",
        eventHandler: _eventHandlerC,
      },
    ]);

    await p2.destroy();

    t.deepEquals(p1._proxyBinds.onListeners, []);

    t.equals(
      p1._proxyBinds.onListeners.length,
      0,
      "zero registered on proxy listeners after p2 destroy"
    );
  })();

  // on / once / mix / destroy
  await (async () => {
    const p1 = new PhantomCore();
    const p2 = new PhantomCore();
    const p3 = new PhantomCore();

    const _eventHandlerA = () => {
      throw new Error("should not be invoked");
    };

    const _eventHandlerB = () => {
      throw new Error("should not be invoked");
    };

    const _eventHandlerC = () => {
      throw new Error("should not be invoked");
    };

    const _eventHandlerD = () => {
      throw new Error("should not be invoked");
    };

    p1.proxyOn(p2, EVT_UPDATED, _eventHandlerA);
    p1.proxyOn(p2, EVT_UPDATED, _eventHandlerB);
    p1.proxyOn(p2, "some-test-event", _eventHandlerC);
    p1.proxyOnce(p3, EVT_UPDATED, _eventHandlerD);

    t.deepEquals(p1._proxyBinds, {
      onListeners: [
        {
          proxyInstance: p2,
          eventName: "updated",
          eventHandler: _eventHandlerA,
        },
        {
          proxyInstance: p2,
          eventName: "updated",
          eventHandler: _eventHandlerB,
        },
        {
          proxyInstance: p2,
          eventName: "some-test-event",
          eventHandler: _eventHandlerC,
        },
      ],
      onceListeners: [
        {
          proxyInstance: p3,
          eventName: "updated",
          eventHandler: _eventHandlerD,
        },
      ],
    });

    await p2.destroy();

    t.deepEquals(p1._proxyBinds, {
      onListeners: [],
      onceListeners: [
        {
          proxyInstance: p3,
          eventName: "updated",
          eventHandler: _eventHandlerD,
        },
      ],
    });

    t.equals(
      p1._proxyBinds.onListeners.length,
      0,
      "zero registered on proxy listeners after p2 destroy"
    );
  })();

  // once / destroy
  await (async () => {
    const p1 = new PhantomCore();
    const p2 = new PhantomCore();

    const _eventHandler = () => {
      throw new Error("should not be invoked");
    };

    p1.proxyOnce(p2, EVT_UPDATED, _eventHandler);

    t.ok(
      p1._proxyBinds.onceListeners.length === 1,
      "one registered once proxy listener bind on p1"
    );

    t.deepEquals(p1._proxyBinds.onceListeners, [
      {
        proxyInstance: p2,
        eventName: "updated",
        eventHandler: _eventHandler,
      },
    ]);

    await p2.destroy();

    t.deepEquals(p1._proxyBinds.onceListeners, []);

    t.equals(
      p1._proxyBinds.onceListeners.length,
      0,
      "zero registered once proxy listeners after p2 destroy"
    );
  })();

  t.end();
});
