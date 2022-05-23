import test from "tape";
import EventEmitter from "events";
import PhantomCore, { EVT_DESTROY } from "../src";

test("event proxy error handling", async t => {
  t.plan(11);

  const p1 = new PhantomCore();
  const p2 = new PhantomCore();

  t.throws(
    () => {
      p1.proxyOn(new EventEmitter(), "mock-event", () =>
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
      p1.proxyOn(p1, "mock-event", () =>
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
      p1.proxyOnce(new EventEmitter(), "mock-event", () =>
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
      p1.proxyOnce(p1, "mock-event", () =>
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
      p1.proxyOff(new EventEmitter(), "mock-event", () =>
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
      p1.proxyOff(p1, "mock-event", () =>
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
          p2.proxyOn(p1, "mock-event", () => {
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
          p2.proxyOnce(p1, "mock-event", () => {
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
            p1.emit("mock-event");
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

      p2.proxyOn(p1, "mock-event", _eventHandler);
      p2.proxyOff(p1, "mock-event", _eventHandler);

      p1.emit("mock-event");
    },
    Error,
    "proxyOff unbinds event listener when bound w/ proxyOn"
  );

  t.doesNotThrow(
    () => {
      const _eventHandler = () => {
        throw new Error("proxyOff is not working as expected");
      };

      p2.proxyOnce(p1, "mock-event", _eventHandler);
      p2.proxyOff(p1, "mock-event", _eventHandler);

      p1.emit("mock-event");
    },
    Error,
    "proxyOff unbinds event listener when bound w/ proxyOnce"
  );

  t.doesNotThrow(async () => {
    await Promise.all([p1.destroy(), p2.destroy()]);
  }, "successfully destructs PhantomCore after proxying");

  t.end();
});

test("event proxy host destruct handling", async t => {
  t.plan(10);

  const p1 = new PhantomCore();
  const p2 = new PhantomCore();
  const p3 = new PhantomCore();

  const lenUpdateEventListenerCount = p1.listenerCount("mock-event");

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

  p1.proxyOn(p2, "mock-event", _eventHandlerA);
  p1.proxyOnce(p2, "mock-event", _eventHandlerB);
  p1.proxyOn(p2, "mock-event-b", _eventHandlerC);
  p1.proxyOnce(p2, "mock-event-b", _eventHandlerD);

  t.equals(
    p3.listenerCount("mock-event"),
    0,
    "p3 contains zero mock-event listeners before adding proxy events"
  );

  p1.proxyOn(p3, "mock-event", _eventHandlerA);
  p1.proxyOnce(p3, "mock-event", _eventHandlerB);
  p1.proxyOn(p3, "mock-event-b", _eventHandlerC);
  p1.proxyOnce(p3, "mock-event-b", _eventHandlerD);

  t.equals(
    p1.listenerCount("mock-event"),
    lenUpdateEventListenerCount,
    "p1 mock-event listener count does not increase when proxying events to p2 and p3"
  );

  t.equals(
    p2.listenerCount("mock-event"),
    lenUpdateEventListenerCount + 2,
    "p2 mock-event listener increments by two when issued proxied events from p1"
  );

  t.equals(
    p3.listenerCount("mock-event"),
    lenUpdateEventListenerCount + 2,
    "p3 mock-event listener increments by two when issued proxied events from p1"
  );

  t.equals(
    p3.listenerCount("mock-event-b"),
    2,
    'p3 contains two "mock-event-b" listeners'
  );

  p1.proxyOff(p3, "mock-event-b", _eventHandlerD);

  t.equals(
    p3.listenerCount("mock-event-b"),
    1,
    'p3 contains one "mock-event-b" listener after removing one once listener'
  );

  p1.proxyOff(p3, "mock-event", _eventHandlerB);

  t.equals(
    p3.listenerCount("mock-event"),
    1,
    "p3 contains one mock-event listener after remove one on listener"
  );

  // Destruct the proxy host
  await p1.destroy();

  t.equals(
    p3.listenerCount("mock-event-b"),
    0,
    'p3 contains zero "mock-event-b" listeners after destructing p1'
  );

  t.equals(
    p3.listenerCount("mock-event"),
    0,
    "p3 contains zero mock-event listeners after destructing p1"
  );

  t.end();
});

test("same event proxy handler for on and once", async t => {
  t.plan(4);

  const p1 = new PhantomCore();
  const p2 = new PhantomCore();

  const _eventHandler = () => {
    throw new Error("Should not get here");
  };

  t.equals(
    p2.listenerCount("mock-event"),
    0,
    "zero initial mock-event listeners"
  );

  p1.proxyOn(p2, "mock-event", _eventHandler);
  p1.proxyOnce(p2, "mock-event", _eventHandler);

  t.equals(
    p2.listenerCount("mock-event"),
    2,
    "two mock-event listeners after on / once proxies"
  );

  p1.proxyOff(p2, "mock-event", _eventHandler);

  t.equals(
    p2.listenerCount("mock-event"),
    1,
    "one remaining mock-event listeners after first proxyOff"
  );

  p1.proxyOff(p2, "mock-event", _eventHandler);

  t.equals(
    p2.listenerCount("mock-event"),
    0,
    "zero remaining mock-event listeners after next proxyOff"
  );

  t.end();
});

test("event proxy on / off", t => {
  t.plan(2);

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

  p1.proxyOn(p2, "mock-event", _eventHandlerA);
  p1.proxyOn(p2, "mock-event", _eventHandlerB);
  p1.proxyOn(p2, "mock-event-b", _eventHandlerC);

  t.equals(
    p1._eventProxyStack.getTargetInstanceQueueDepth(p2),
    3,
    "three registered on proxy listeners bound on p1, to target p2"
  );

  p1.proxyOff(p2, "mock-event", _eventHandlerB);

  t.equals(
    p1._eventProxyStack.getTargetInstanceQueueDepth(p2),
    2,
    "two registered on proxy listeners bound on p1, to target p2"
  );

  t.end();
});

test("event proxy once / off", async t => {
  t.plan(2);

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

  p1.proxyOnce(p2, "mock-event", _eventHandlerA);
  p1.proxyOnce(p2, "mock-event", _eventHandlerB);
  p1.proxyOnce(p2, "mock-event-b", _eventHandlerC);

  t.equals(
    p1._eventProxyStack.getTargetInstanceQueueDepth(p2),
    3,
    "three registered once proxy listeners bound on p1, to target p2"
  );

  p1.proxyOff(p2, "mock-event", _eventHandlerB);

  t.equals(
    p1._eventProxyStack.getTargetInstanceQueueDepth(p2),
    2,
    "two registered once proxy listeners bound on p1, to target p2"
  );

  t.end();
});

test("event proxy on / destroy", async t => {
  t.plan(2);

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

  p1.proxyOn(p2, "mock-event", _eventHandlerA);
  p1.proxyOn(p2, "mock-event", _eventHandlerB);
  p1.proxyOn(p2, "mock-event-b", _eventHandlerC);

  t.equals(
    p1._eventProxyStack.getTargetInstanceQueueDepth(p2),
    3,
    "three registered on proxy listeners bound on p1, to target p2"
  );

  await p2.destroy();

  t.equals(
    p1._eventProxyStack.getTargetInstanceQueueDepth(p2),
    0,
    "zero registered on proxy listeners bound on p1, to target p2"
  );

  t.end();
});

test("event proxy on / once / mix / destroy", async t => {
  t.plan(4);

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

  p1.proxyOn(p2, "mock-event", _eventHandlerA);
  p1.proxyOn(p2, "mock-event", _eventHandlerB);
  p1.proxyOn(p2, "mock-event-b", _eventHandlerC);
  p1.proxyOnce(p3, "mock-event", _eventHandlerD);

  t.equals(
    p1._eventProxyStack.getTargetInstanceQueueDepth(p2),
    3,
    "three registered on proxy listeners bound on p1, to target p2"
  );

  t.equals(
    p1._eventProxyStack.getTargetInstanceQueueDepth(p3),
    1,
    "one registered on proxy listeners bound on p1, to target p2"
  );

  await p2.destroy();

  t.equals(
    p1._eventProxyStack.getTargetInstanceQueueDepth(p2),
    0,
    "zero registered on proxy listeners bound on p1, to target p2, after p2 destroy"
  );

  t.equals(
    p1._eventProxyStack.getTargetInstanceQueueDepth(p3),
    1,
    "one registered on proxy listeners bound on p1, to target p3, after p2 destroy"
  );

  t.end();
});

test("event proxy once / destroy", async t => {
  t.plan(2);

  const p1 = new PhantomCore();
  const p2 = new PhantomCore();

  const _eventHandler = () => {
    throw new Error("Should not get here");
  };

  p1.proxyOnce(p2, "mock-event", _eventHandler);

  t.equals(
    p1._eventProxyStack.getTargetInstanceQueueDepth(p2),
    1,
    "one registered on proxy listeners bound on p1, to target p2"
  );

  await p2.destroy();

  t.equals(
    p1._eventProxyStack.getTargetInstanceQueueDepth(p2),
    0,
    "zero registered on proxy listeners bound on p1, to target p2, after p2 destroy"
  );
});

test("event proxy destruct handling management", async t => {
  t.plan(8);

  const p1 = new PhantomCore();
  const p2 = new PhantomCore();

  const origPerInstanceDestroyedListenerCount = p1.listenerCount(EVT_DESTROY);

  const _eventHandlerA = () => {
    throw new Error("Should not get here");
  };

  const _eventHandlerB = () => {
    throw new Error("Should not get here");
  };

  p1.proxyOn(p2, "mock-event", _eventHandlerA);

  t.equals(
    p1.listenerCount(EVT_DESTROY),
    origPerInstanceDestroyedListenerCount,
    "p1 EVT_DESTROY listener count is unaffected by adding new proxy target instance using proxyOn"
  );

  t.equals(
    p2.listenerCount(EVT_DESTROY),
    origPerInstanceDestroyedListenerCount + 1,
    "p2 EVT_DESTROY listener count is incremented by one, being a target instance for a proxy"
  );

  p1.proxyOnce(p2, "mock-event", _eventHandlerB);

  t.equals(
    p1.listenerCount(EVT_DESTROY),
    origPerInstanceDestroyedListenerCount,
    "p1 EVT_DESTROY listener count is unaffected by adding new proxy target instance using proxyOnce"
  );

  t.equals(
    p2.listenerCount(EVT_DESTROY),
    origPerInstanceDestroyedListenerCount + 1,
    "p2 EVT_DESTROY listener count remains incremented by one, despite having subsequent proxy event assigned to it"
  );

  p1.proxyOff(p2, "mock-event", _eventHandlerB);

  t.equals(
    p2.listenerCount(EVT_DESTROY),
    origPerInstanceDestroyedListenerCount + 1,
    "p2 EVT_DESTROY listener count remains incremented by one, after removing an event proxy from it"
  );

  p1.proxyOff(p2, "mock-event", _eventHandlerA);

  t.equals(
    p2.listenerCount(EVT_DESTROY),
    origPerInstanceDestroyedListenerCount,
    "p2 EVT_DESTROY listener count goes back to original value after removing all event proxies from it"
  );

  p1.proxyOn(p2, "mock-event", _eventHandlerA);

  t.equals(
    p2.listenerCount(EVT_DESTROY),
    origPerInstanceDestroyedListenerCount + 1,
    "p2 EVT_DESTROY listener count is incremented by one after re-assigning an event proxy to it"
  );

  p1.proxyOff(p2, "mock-event", _eventHandlerA);

  t.equals(
    p2.listenerCount(EVT_DESTROY),
    origPerInstanceDestroyedListenerCount,
    "p2 EVT_DESTROY listener count goes back to original value again after removing all event proxies from it"
  );

  t.end();
});
