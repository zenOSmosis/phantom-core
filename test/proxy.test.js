const test = require("tape");
const { EventEmitter } = require("events");
const PhantomCore = require("../src");
const { EVT_UPDATED } = PhantomCore;

// TODO: Add testing for proxyOnRemotes
// TODO: Ensure there is no persistent memory leakage after destruct

test("proxy error handling", async t => {
  t.plan(11);

  const p1 = new PhantomCore();
  const p2 = new PhantomCore();

  t.throws(
    () => {
      p1.proxyOn(new EventEmitter(), EVT_UPDATED, () =>
        // NOTE: Not throwing here because we want to make sure the error is
        // thrown from the instance
        console.log("Should not get here")
      );
    },
    ReferenceError,
    "proxyOn cannot proxy to non-PhantomCore instance"
  );

  t.throws(
    () => {
      p1.proxyOn(p1, EVT_UPDATED, () =>
        // NOTE: Not throwing here because we want to make sure the error is
        // thrown from the instance
        console.log("Should not get here")
      );
    },
    ReferenceError,
    "proxyOn cannot proxy to same PhantomCore instance"
  );

  t.throws(
    () => {
      p1.proxyOnce(new EventEmitter(), EVT_UPDATED, () =>
        // NOTE: Not throwing here because we want to make sure the error is
        // thrown from the instance
        console.log("Should not get here")
      );
    },
    ReferenceError,
    "proxyOnce cannot proxy to non-PhantomCore instance"
  );

  t.throws(
    () => {
      p1.proxyOnce(p1, EVT_UPDATED, () =>
        // NOTE: Not throwing here because we want to make sure the error is
        // thrown from the instance
        console.log("Should not get here")
      );
    },
    ReferenceError,
    "proxyOnce cannot proxy to same PhantomCore instance"
  );

  t.throws(
    () => {
      p1.proxyOff(new EventEmitter(), EVT_UPDATED, () =>
        // NOTE: Not throwing here because we want to make sure the error is
        // thrown from the instance
        console.log("Should not get here")
      );
    },
    ReferenceError,
    "proxyOff cannot proxy to non-PhantomCore instance"
  );

  t.throws(
    () => {
      p1.proxyOff(p1, EVT_UPDATED, () =>
        // NOTE: Not throwing here because we want to make sure the error is
        // thrown from the instance
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

test("proxy event registration / unregistration", async t => {
  // TODO: Implement plan

  const p1 = new PhantomCore();
  const p2 = new PhantomCore();
  const p3 = new PhantomCore();

  const lenUpdateEventListenerCount = p1.listenerCount(EVT_UPDATED);

  t.equals(
    lenUpdateEventListenerCount,
    0,
    "initial lenUpdateEventListenerCount is zero"
  );

  const _eventHandlerA = () => {
    throw new Error("Should not get here");
  };

  const _eventHandlerB = () => {
    throw new Error("Should not get here");
  };

  const _eventHandlerC = () => {
    throw new Error("Should not get here");
  };

  const _eventHandlerD = () => {
    throw new Error("Should not get here");
  };

  p1.proxyOn(p2, EVT_UPDATED, _eventHandlerA);
  p1.proxyOnce(p2, EVT_UPDATED, _eventHandlerB);
  p1.proxyOn(p2, "some-test-event", _eventHandlerC);
  p1.proxyOnce(p2, "some-test-event", _eventHandlerD);

  t.equals(
    p3.listenerCount(EVT_UPDATED),
    0,
    "p3 contains zero EVT_UPDATED listeners before adding proxy events"
  );

  p1.proxyOn(p3, EVT_UPDATED, _eventHandlerA);
  p1.proxyOnce(p3, EVT_UPDATED, _eventHandlerB);
  p1.proxyOn(p3, "some-test-event", _eventHandlerC);
  p1.proxyOnce(p3, "some-test-event", _eventHandlerD);

  t.equals(
    p1.listenerCount(EVT_UPDATED),
    lenUpdateEventListenerCount,
    "p1 EVT_UPDATED listener count does not increase when proxying events to p2 and p3"
  );

  t.equals(
    p2.listenerCount(EVT_UPDATED),
    lenUpdateEventListenerCount + 2,
    "p2 EVT_UPDATED listener increments by two when issued proxied events from p1"
  );

  t.equals(
    p3.listenerCount(EVT_UPDATED),
    lenUpdateEventListenerCount + 2,
    "p3 EVT_UPDATED listener increments by two when issued proxied events from p1"
  );

  t.equals(
    p3.listenerCount("some-test-event"),
    2,
    'p3 contains two "some-test-event" listeners'
  );

  p1.proxyOff(p3, "some-test-event", _eventHandlerD);

  t.equals(
    p3.listenerCount("some-test-event"),
    1,
    'p3 contains one "some-test-event" listener after removing one once listener'
  );

  p1.proxyOff(p3, EVT_UPDATED, _eventHandlerB);

  t.equals(
    p3.listenerCount(EVT_UPDATED),
    1,
    "p3 contains one EVT_UPDATED listener after remove one on listener"
  );

  await p1.destroy();

  t.equals(
    p3.listenerCount("some-test-event"),
    0,
    'p3 contains zero "some-test-event" listeners after destructing p1'
  );

  t.equals(
    p3.listenerCount(EVT_UPDATED),
    0,
    "p3 contains zero EVT_UPDATED listeners after destructing p1"
  );

  t.end();
});

// TODO: Uncomment
/*
test("same proxy event handler for on and once", async t => {
  // TODO: Implement plan

  const p1 = new PhantomCore();
  const p2 = new PhantomCore();

  const _eventHandler = () => {
    throw new Error("Should not get here");
  };

  t.equals(
    p2.listenerCount(EVT_UPDATED),
    0,
    "zero initial EVT_UPDATED listeners"
  );

  p1.proxyOn(p2, EVT_UPDATED, _eventHandler);
  p1.proxyOnce(p2, EVT_UPDATED, _eventHandler);

  t.equals(
    p2.listenerCount(EVT_UPDATED),
    2,
    "two EVT_UPDATED listeners after on / once proxies"
  );

  p1.proxyOff(p2, EVT_UPDATED, _eventHandler);

  t.equals(
    p2.listenerCount(EVT_UPDATED),
    0,
    "zero remaining EVT_UPDATED listeners after proxyOff"
  );

  t.end();
});
*/

test("proxy unregistration", async t => {
  // TODO: Implement plan

  // on / off
  await (async () => {
    const p1 = new PhantomCore();
    const p2 = new PhantomCore();

    const _eventHandlerA = () => {
      throw new Error("Should not get here");
    };

    const _eventHandlerB = () => {
      throw new Error("Should not get here");
    };

    const _eventHandlerC = () => {
      throw new Error("Should not get here");
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
        targetInstance: p2,
        eventName: "updated",
        eventHandler: _eventHandlerA,
      },
      {
        targetInstance: p2,
        eventName: "updated",
        eventHandler: _eventHandlerB,
      },
      {
        targetInstance: p2,
        eventName: "some-test-event",
        eventHandler: _eventHandlerC,
      },
    ]);

    p1.proxyOff(p2, EVT_UPDATED, _eventHandlerB);

    t.deepEquals(p1._proxyBinds.onListeners, [
      {
        targetInstance: p2,
        eventName: "updated",
        eventHandler: _eventHandlerA,
      },
      {
        targetInstance: p2,
        eventName: "some-test-event",
        eventHandler: _eventHandlerC,
      },
    ]);
  })();

  // once / off
  await (async () => {
    const p1 = new PhantomCore();
    const p2 = new PhantomCore();

    const _eventHandlerA = () => {
      throw new Error("Should not get here");
    };

    const _eventHandlerB = () => {
      throw new Error("Should not get here");
    };

    const _eventHandlerC = () => {
      throw new Error("Should not get here");
    };

    p1.proxyOnce(p2, EVT_UPDATED, _eventHandlerA);
    p1.proxyOnce(p2, EVT_UPDATED, _eventHandlerB);
    p1.proxyOnce(p2, "some-test-event", _eventHandlerC);

    t.deepEquals(p1._proxyBinds.onceListeners, [
      {
        targetInstance: p2,
        eventName: "updated",
        eventHandler: _eventHandlerA,
      },
      {
        targetInstance: p2,
        eventName: "updated",
        eventHandler: _eventHandlerB,
      },
      {
        targetInstance: p2,
        eventName: "some-test-event",
        eventHandler: _eventHandlerC,
      },
    ]);

    p1.proxyOff(p2, EVT_UPDATED, _eventHandlerB);

    t.deepEquals(p1._proxyBinds.onceListeners, [
      {
        targetInstance: p2,
        eventName: "updated",
        eventHandler: _eventHandlerA,
      },
      {
        targetInstance: p2,
        eventName: "some-test-event",
        eventHandler: _eventHandlerC,
      },
    ]);
  })();

  // on / destroy
  await (async () => {
    const p1 = new PhantomCore();
    const p2 = new PhantomCore();

    const _eventHandlerA = () => {
      throw new Error("Should not get here");
    };

    const _eventHandlerB = () => {
      throw new Error("Should not get here");
    };

    const _eventHandlerC = () => {
      throw new Error("Should not get here");
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
        targetInstance: p2,
        eventName: "updated",
        eventHandler: _eventHandlerA,
      },
      {
        targetInstance: p2,
        eventName: "updated",
        eventHandler: _eventHandlerB,
      },
      {
        targetInstance: p2,
        eventName: "some-test-event",
        eventHandler: _eventHandlerC,
      },
    ]);

    await p2.destroy();

    t.deepEquals(p1._proxyBinds.onListeners, []);
  })();

  // on / once / mix / destroy
  await (async () => {
    const p1 = new PhantomCore();
    const p2 = new PhantomCore();
    const p3 = new PhantomCore();

    const _eventHandlerA = () => {
      throw new Error("Should not get here");
    };

    const _eventHandlerB = () => {
      throw new Error("Should not get here");
    };

    const _eventHandlerC = () => {
      throw new Error("Should not get here");
    };

    const _eventHandlerD = () => {
      throw new Error("Should not get here");
    };

    p1.proxyOn(p2, EVT_UPDATED, _eventHandlerA);
    p1.proxyOn(p2, EVT_UPDATED, _eventHandlerB);
    p1.proxyOn(p2, "some-test-event", _eventHandlerC);
    p1.proxyOnce(p3, EVT_UPDATED, _eventHandlerD);

    t.deepEquals(p1._proxyBinds, {
      onListeners: [
        {
          targetInstance: p2,
          eventName: "updated",
          eventHandler: _eventHandlerA,
        },
        {
          targetInstance: p2,
          eventName: "updated",
          eventHandler: _eventHandlerB,
        },
        {
          targetInstance: p2,
          eventName: "some-test-event",
          eventHandler: _eventHandlerC,
        },
      ],
      onceListeners: [
        {
          targetInstance: p3,
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
          targetInstance: p3,
          eventName: "updated",
          eventHandler: _eventHandlerD,
        },
      ],
    });
  })();

  // once / destroy
  await (async () => {
    const p1 = new PhantomCore();
    const p2 = new PhantomCore();

    const _eventHandler = () => {
      throw new Error("Should not get here");
    };

    p1.proxyOnce(p2, EVT_UPDATED, _eventHandler);

    t.ok(
      p1._proxyBinds.onceListeners.length === 1,
      "one registered once proxy listener bind on p1"
    );

    t.deepEquals(p1._proxyBinds.onceListeners, [
      {
        targetInstance: p2,
        eventName: "updated",
        eventHandler: _eventHandler,
      },
    ]);

    await p2.destroy();

    t.deepEquals(p1._proxyBinds.onceListeners, []);
  })();

  t.end();
});
