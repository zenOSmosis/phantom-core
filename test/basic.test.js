const test = require("tape");
const PhantomCore = require("../src");
const { EVT_READY, EVT_UPDATED, EVT_BEFORE_DESTROY, EVT_DESTROYED, sleep } =
  PhantomCore;

/**
 * Tests instantiation and destroying of PhantomCore with the default options
 * (no options passed).
 */
test("registers and unregisters instances", async t => {
  t.plan(2);

  const oCount = PhantomCore.getInstanceCount();

  const phantom = new PhantomCore();

  t.equals(
    PhantomCore.getInstanceCount(),
    oCount + 1,
    "increments instance count on new instance"
  );

  await phantom.destroy();

  t.equals(
    PhantomCore.getInstanceCount(),
    oCount,
    "decrements instance count when instance is destroyed"
  );

  t.end();
});

test("uuid and short uuid", async t => {
  t.plan(5);

  const phantom1 = new PhantomCore();
  const phantom2 = new PhantomCore();

  t.notEquals(
    phantom1.getUUID(),
    phantom1.getShortUUID(),
    "uuid and short uuid do not match"
  );

  t.equals(phantom1.getUUID().length, 36, "uuid is 36 characters long");

  t.equals(
    phantom1.getShortUUID().length,
    22,
    "short uuid is 22 characters long"
  );

  t.notEquals(
    phantom1.getUUID(),
    phantom2.getUUID(),
    "two instances have unique uuids"
  );
  t.notEquals(
    phantom1.getShortUUID(),
    phantom2.getShortUUID(),
    "two instances have unique short uuids"
  );

  await Promise.all([phantom1.destroy(), phantom2.destroy()]);

  t.end();
});

test("get options", t => {
  t.plan(4);

  const phantom = new PhantomCore({
    testOption: 123,
    logLevel: 4,
  });

  t.deepEquals(phantom.getOptions(), {
    testOption: 123,
    logLevel: 4,
    isAsync: false,
    symbol: null,
    title: null,
    hasAutomaticBindings: true,
  });

  t.equals(phantom.getOption("testOption"), 123, "retrieves testOption option");
  t.equals(phantom.getOption("logLevel"), 4, "retrieves logLevel option");
  t.equals(phantom.getOption("symbol"), null, "retrieves symbol option");

  t.end();
});

test("get instance with symbol", t => {
  t.plan(7);

  t.throws(
    () => {
      new PhantomCore({ symbol: { notASymbol: true } });
    },
    TypeError,
    "throws TypeError when passing invalid symbol type"
  );

  const s1 = Symbol("a");
  const s2 = Symbol("a");

  // NOTE: These tests should not technically be needed, but might help
  // determine if there is a browser bug?
  t.ok(s1 === s1, "symbol compares against itself");
  t.ok(s1 !== s2, "symbol differentiates against other symbol with same value");

  const p1 = new PhantomCore({ symbol: s1 });

  t.ok(
    p1.getIsSameInstance(PhantomCore.getInstanceWithSymbol(s1)),
    "retrieves instance with symbol"
  );

  t.throws(() => {
    new PhantomCore({ symbol: s1 });
  }, "does not allow creation of new instance with previously used symbol");

  p1.destroy();

  t.ok(
    new PhantomCore({ symbol: s1 }),
    "enables creation of new instance with existing symbol if the previous instance has been destroyed"
  );

  const p2 = new PhantomCore();
  t.ok(
    p2.getSymbol() === null,
    "instance created without a symbol returns null for getSymbol()"
  );

  t.end();
});

test("title support", async t => {
  t.plan(2);

  const phantom = new PhantomCore({ title: "test-title" });

  t.equals(
    phantom.getTitle(),
    "test-title",
    "title passed to constructor is registered"
  );

  await Promise.all([
    new Promise(resolve => {
      phantom.once(EVT_UPDATED, () => {
        t.equals(
          phantom.getTitle(),
          "some-other-title",
          "emits EVT_UPDATED when title has changed"
        );

        resolve();
      });
    }),

    phantom.setTitle("some-other-title"),
  ]);

  t.end();
});

test("determines class name", async t => {
  t.plan(3);

  const phantom1 = new PhantomCore();

  t.equals(
    phantom1.getClassName(),
    "PhantomCore",
    "determines its own class name"
  );

  t.ok(phantom1.getClass() === PhantomCore, "determines its own class");

  class Phantom2 extends PhantomCore {}

  const phantom2 = new Phantom2();

  t.ok(
    phantom2.getClassName() === "Phantom2",
    "extensions know their class name"
  );

  phantom1.destroy();
  phantom2.destroy();

  t.end();
});

test("onceReady handling", async t => {
  t.plan(3);

  const phantom = new PhantomCore();

  t.ok(phantom.getIsReady(), "ready by default");

  await phantom.onceReady();
  t.ok(true, "after first onceReady");

  await phantom.onceReady();
  t.ok(true, "after second onceReady");

  phantom.destroy();

  t.end();
});

test("emits EVT_READY (even in sync mode)", async t => {
  t.plan(1);

  const phantom = new PhantomCore();

  await new Promise(resolve => {
    phantom.once(EVT_READY, () => {
      t.ok(true, "emits EVT_READY after init");

      resolve();
    });
  });

  phantom.destroy();

  t.end();
});

test("same instance detection", t => {
  t.plan(4);

  const phantom1 = new PhantomCore();
  const phantom1UUID = phantom1.getUUID();

  const phantom2 = new PhantomCore();
  const phantom2UUID = phantom2.getUUID();

  t.ok(phantom1.getIsSameInstance(phantom1), "can identify its own instance");

  t.ok(
    PhantomCore.getInstanceWithUUID(phantom1UUID).getIsSameInstance(phantom1)
  );

  t.notOk(
    phantom1.getIsSameInstance(phantom2),
    "knows other instance is not its own"
  );

  t.ok(
    PhantomCore.getInstanceWithUUID(phantom2UUID).getIsSameInstance(phantom2)
  );

  phantom1.destroy();
  phantom2.destroy();

  t.end();
});

test("determines instance uptime", async t => {
  t.plan(3);

  const phantom = new PhantomCore();

  t.ok(
    phantom.getInstanceUptime() < 1,
    "knows that it has been up for less than 1 second"
  );

  await new Promise(resolve => setTimeout(resolve, 1000));

  t.ok(
    phantom.getInstanceUptime() >= 1,
    "knows that it has been up for at least 1 second"
  );

  await phantom.destroy();

  t.ok(phantom.getInstanceUptime() === 0, "destroyed phantom returns 0 uptime");

  t.end();
});

test("events and destruct", async t => {
  t.plan(8);

  const phantom = new PhantomCore();

  t.notOk(
    phantom.getIsDestroyed(),
    "determines that active state is not destroyed"
  );

  phantom.on("mock-event", () => {
    throw new Error("Should never get here");
  });

  t.throws(() => {
    phantom.emit("mock-event");
  }, "triggers events");

  phantom.once(EVT_DESTROYED, () => {
    t.ok(true, "triggers EVT_DESTROYED after destroying");

    t.ok(
      phantom.getIsDestroyed(),
      "destroy state is true when EVT_DESTROYED emit"
    );
  });

  await phantom.destroy();
  t.ok(true, "successfully destroys");

  t.ok(
    phantom.getIsDestroyed(),
    "determines that post destroyed state is destroyed"
  );

  phantom.emit("mock-event");
  t.ok(
    phantom.listenerCount("mock-event") === 0,
    "removes event listeners after destroying"
  );

  t.ok(
    undefined === (await phantom.destroy()),
    "subsequent calls to destroy are ignored"
  );

  t.end();
});

test("no incorrect usage of EVT_DESTROYED", async t => {
  t.plan(3);

  const phantom = new PhantomCore();

  t.throws(
    () => phantom.emit(EVT_DESTROYED),
    Error,
    "throws Error if EVT_DESTROYED is arbitrarily emit on instance"
  );

  t.ok(
    phantom.getIsDestroying(),
    true,
    "proceeds to destroying phase once EVT_DESTROYED is improperly emit"
  );

  await new Promise(resolve => phantom.once(EVT_DESTROYED, resolve));

  t.ok(
    phantom.getIsDestroyed(),
    true,
    "shuts down after winding up in destroying phase"
  );

  t.end();
});

test("no subsequent usage of destroy() after full destruct", async t => {
  t.plan(1);

  const phantom = new PhantomCore();

  // Don't await
  phantom.destroy();

  await new Promise(resolve => phantom.once(EVT_DESTROYED, resolve));

  try {
    await phantom.destroy();

    t.ok(true, "silently ignores final destruct attempt");
  } catch (err) {
    throw err;
  }
});

test("multiple destroyHandler calls", async t => {
  t.plan(3);

  const phantom = new PhantomCore();

  let preDestructEventIterations = 0;
  phantom.on(EVT_BEFORE_DESTROY, () => ++preDestructEventIterations);

  let postDestructEventIterations = 0;
  phantom.on(EVT_DESTROYED, () => ++postDestructEventIterations);

  let ab = [];

  for (let i = 0; i < 10; i++) {
    // Sync destroy call
    phantom.destroy(() => {
      ab.push(i);
    });

    // Async destroy call
    phantom.destroy(async () => {
      return new Promise(resolve => {
        ab.push(i);

        resolve();
      });
    });
  }

  // Prolonged wait async destroy call
  phantom.destroy(async () => {
    ab.push("before-end");
  });

  // Final destroy call
  await phantom.destroy(() => {
    ab.push("end");
  });

  t.deepEquals(ab, [
    0,
    0,
    1,
    1,
    2,
    2,
    3,
    3,
    4,
    4,
    5,
    5,
    6,
    6,
    7,
    7,
    8,
    8,
    9,
    9,
    "before-end",
    "end",
  ]);

  t.equals(
    preDestructEventIterations,
    1,
    "EVT_BEFORE_DESTROY event emits only once regardless of times destroy method is called"
  );

  t.equals(
    postDestructEventIterations,
    1,
    "EVT_DESTROYED event emits only once regardless of times destroy method is called"
  );

  t.end();
});

test("retrieves methods and properties", t => {
  t.plan(2);

  const phantom = new PhantomCore();

  t.ok(
    phantom.getPropertyNames().includes("logger") &&
      phantom.getPropertyNames().includes("log") &&
      phantom.getPropertyNames().includes("_uuid"),
    "retrieves property names"
  );

  t.ok(
    phantom.getMethodNames().includes("on") &&
      phantom.getMethodNames().includes("off") &&
      phantom.getMethodNames().includes("emit"),
    "retrieves property names"
  );

  t.end();
});

test("prevents methods from being called after destroyed", t => {
  t.plan(1);

  t.doesNotThrow(async () => {
    class TestDestroyer extends PhantomCore {
      a() {
        throw new Error("a() was called");
      }
    }

    const phantom = new TestDestroyer();

    await phantom.destroy();

    phantom.a();
  }, "does not call non-keep-alive methods after destruct");

  t.end();
});

test("on / once / off use super return types", async t => {
  t.plan(3);

  const phantom = new PhantomCore();

  const retOn = phantom.on(EVT_UPDATED, () => null);

  t.ok(
    Object.is(retOn, phantom),
    "on returns a self reference to PhantomCore instance"
  );

  const retOnce = phantom.once(EVT_UPDATED, () => null);

  t.ok(
    Object.is(retOnce, phantom),
    "once returns a self reference to PhantomCore instance"
  );

  const retOff = phantom.off(EVT_UPDATED, () => null);

  t.ok(
    Object.is(retOff, phantom),
    "off returns a self reference to PhantomCore instance"
  );

  await phantom.destroy();

  t.end();
});

test("total listener count", async t => {
  t.plan(4);

  const phantom = new PhantomCore();

  let initialListenerCount = phantom.getTotalListenerCount();

  t.equals(
    typeof initialListenerCount,
    "number",
    "getTotalListenerCount() returns numeric"
  );

  phantom.on("test-event-a", () => null);

  t.equals(
    initialListenerCount + 1,
    phantom.getTotalListenerCount(),
    "total listener count is increased by one when adding new event"
  );

  phantom.on("test-event-b", () => null);

  t.equals(
    initialListenerCount + 2,
    phantom.getTotalListenerCount(),
    "total listener count is increased by two when adding another event"
  );

  await phantom.destroy();

  t.equals(
    phantom.getTotalListenerCount(),
    0,
    "total listener count is set to 0 after instance destruct"
  );

  t.end();
});

test("phantom properties", async t => {
  t.plan(1);

  class ExtendedCore extends PhantomCore {}

  class ExtendedCore2 extends PhantomCore {
    constructor(...args) {
      super(...args);
    }
  }

  class TestPhantomProperties extends PhantomCore {
    constructor() {
      super();

      this._pred1 = {};

      this._pred2 = new PhantomCore();

      this._pred3 = () => null;

      this._pred4 = "hello";

      this._pred5 = new ExtendedCore();

      this._pred6 = new ExtendedCore2();

      this._pred7 = ExtendedCore;
      this._pred8 = ExtendedCore2;
      this._pred9 = PhantomCore;
    }
  }

  const testPhantom = new TestPhantomProperties();

  t.deepEquals(testPhantom.getPhantomProperties(), [
    "_pred2",
    "_pred5",
    "_pred6",
  ]);

  // Silence memory leak warnings
  testPhantom.registerShutdownHandler(async () => {
    await Promise.all([
      testPhantom._pred2.destroy(),
      testPhantom._pred5.destroy(),
      testPhantom._pred6.destroy(),
    ]);
  });

  await testPhantom.destroy();

  t.end();
});

test("symbol toString()", t => {
  t.plan(2);

  const p1 = new PhantomCore();

  t.equals(
    p1.toString(),
    "[object PhantomCore]",
    "resolves non-titled instance as expected"
  );

  p1.setTitle("some-test");

  t.equals(
    p1.toString(),
    "[object some-test]",
    "resolves titled instance as expected"
  );

  t.end();
});

test("shutdown phase event handling", async t => {
  t.plan(3);

  const phantom = new PhantomCore();
  phantom.registerShutdownHandler(() =>
    phantom.emit("__TESTING__-shutdown-handler-invoked", "test-data-a")
  );

  phantom.once(EVT_DESTROYED, () => {
    phantom.emit("__TESTING__-destruct-event-emitted", "test-data-b");
  });

  const orderOps = [];

  await Promise.all([
    new Promise(resolve => {
      phantom.once("__TESTING__-shutdown-handler-invoked", data => {
        orderOps.push("__TESTING__-shutdown-handler-invoked");

        if (data === "test-data-a") {
          t.ok(
            true,
            "received expected event data during shutdown handler phase"
          );

          resolve();
        }
      });
    }),

    new Promise(resolve => {
      phantom.once("__TESTING__-destruct-event-emitted", data => {
        orderOps.push("__TESTING__-destruct-event-emitted");

        if (data === "test-data-b") {
          t.ok(
            true,
            "received expected event data during destruct event phase"
          );

          resolve();
        }
      });
    }),

    phantom.destroy(),
  ]);

  t.equals(
    orderOps[0],
    "__TESTING__-shutdown-handler-invoked",
    "shutdown handler invoked before EVT_DESTROYED"
  );

  t.end();
});

test("shutdown handler stack", async t => {
  t.plan(4);

  const p1 = new PhantomCore();

  t.throws(
    () => {
      p1.registerShutdownHandler("something");
    },
    TypeError,
    "throws TypeError when trying to register non-function shutdown handler"
  );

  p1.registerShutdownHandler(() => {
    throw new Error("Expected error");
  });

  try {
    await p1.destroy();
  } catch (err) {
    t.ok(
      err.message === "Expected error",
      "errors in shutdown stack are thrown from the PhantomCore instance"
    );

    t.notOk(
      p1.getIsDestroyed(),
      "phantom does not register as destroyed if shutdown stack errors"
    );
  }

  const p2 = new PhantomCore();

  let opsRecords = [];

  p2.registerShutdownHandler(() => {
    opsRecords.push("a");
  });

  p2.registerShutdownHandler(async () => {
    await sleep(1000);

    opsRecords.push("b");
  });

  p2.registerShutdownHandler(() => {
    opsRecords.push("c");
  });

  await p2.destroy();

  t.deepEquals(
    opsRecords,
    ["a", "b", "c"],
    "shutdown functions are executed in order (FIFO) and maintain proper order if promises are used"
  );

  t.end();
});
