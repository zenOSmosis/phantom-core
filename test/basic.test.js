import test from "tape";
import PhantomCore, {
  EVT_READY,
  EVT_UPDATE,
  EVT_BEFORE_DESTROY,
  EVT_DESTROY,
  sleep,
} from "../src";

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
  t.plan(3);

  const phantom = new PhantomCore({
    testOption: 123,
    logLevel: 4,
  });

  t.deepEquals(phantom.getOptions(), {
    isAsync: false,
    title: null,
    hasAutomaticBindings: true,
    testOption: 123,
    logLevel: 4,
  });

  t.equals(phantom.getOption("testOption"), 123, "retrieves testOption option");
  t.equals(phantom.getOption("logLevel"), 4, "retrieves logLevel option");

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
      phantom.once(EVT_UPDATE, () => {
        t.equals(
          phantom.getTitle(),
          "some-other-title",
          "emits EVT_UPDATE when title has changed"
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

test("onceReady as-a-promise handling", async t => {
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

test("onceReady reject callback", async t => {
  t.plan(1);

  class TestPrematureDestructPhantomCore extends PhantomCore {
    constructor() {
      super({
        isAsync: true,
      });

      queueMicrotask(() => {
        this._init();
      });
    }

    _init() {
      // Premature destruct
      return this.destroy();
    }
  }

  const phantom = new TestPrematureDestructPhantomCore();

  try {
    await phantom.onceReady(() => {
      throw new Error("onceReady handler should not be invoked");
    });
  } catch (err) {
    t.equals(
      err,
      "Destruct phase started before ready",
      "onceReady rejects if premature destruct"
    );
  }

  await phantom.destroy();

  t.end();
});

test("onceReady success callback -- sync mode", async t => {
  t.plan(1);

  const phantom = new PhantomCore();

  await phantom.onceReady(() => {
    t.ok(phantom.getIsReady(), "callback is called once ready");
  });

  await phantom.destroy();

  t.end();
});

test("onceReady success callback -- async mode", async t => {
  t.plan(2);

  class TestAsyncReadySuccessPhantomCore extends PhantomCore {
    constructor() {
      super({
        isAsync: true,
      });

      queueMicrotask(() => {
        this._init();
      });
    }

    async _init() {
      t.notOk(this.getIsReady());

      return super._init();
    }
  }

  const phantom = new TestAsyncReadySuccessPhantomCore();

  await phantom.onceReady(() => {
    t.ok(phantom.getIsReady(), "callback is called once ready");
  });

  await phantom.destroy();

  t.end();
});

test("emits EVT_READY in sync mode", async t => {
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
  t.plan(2);

  const phantom1 = new PhantomCore();

  const phantom2 = new PhantomCore();

  t.ok(phantom1.getIsSameInstance(phantom1), "can identify its own instance");

  t.notOk(
    phantom1.getIsSameInstance(phantom2),
    "knows other instance is not its own"
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

test("shutdown event handling", async t => {
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

  phantom.once(EVT_DESTROY, () => {
    t.ok(true, "triggers EVT_DESTROY after destroying");

    t.ok(
      phantom.getIsDestroyed(),
      "destroy state is true when EVT_DESTROY emit"
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

  t.equals(
    undefined,
    await phantom.destroy(),
    "subsequent calls to destroy are ignored"
  );

  t.end();
});

test("shutdown phasing", async t => {
  t.plan(10);

  const phantom = new PhantomCore();

  t.notOk(
    phantom.getHasDestroyStarted(),
    "does not have is destroying state before shutdown"
  );
  t.notOk(
    phantom.getIsDestroyed(),
    "does not have destroyed state before shutdown"
  );

  phantom.once(EVT_BEFORE_DESTROY, () => {
    t.notOk(
      phantom.getHasDestroyStarted(),
      "does not have destroying state when EVT_BEFORE_DESTROY emit"
    );

    t.notOk(
      phantom.getIsDestroyed(),
      "does not have destroyed state when EVT_BEFORE_DESTROY emit"
    );
  });

  await phantom.destroy(() => {
    t.ok(
      phantom.getHasDestroyStarted(),
      "has destroying state during shutdown"
    );
    t.notOk(
      phantom.getIsDestroyed(),
      "does not have destroyed state during shutdown"
    );

    phantom.once(EVT_DESTROY, () => {
      t.ok(
        phantom.getHasDestroyStarted(),
        "has destroying state when EVT_DESTROY emit"
      );
      t.ok(
        phantom.getIsDestroyed(),
        "has destroyed state when EVT_DESTROY emit"
      );
    });
  });

  t.ok(
    phantom.getHasDestroyStarted(),
    "maintains has-destroying-started state when destroy() resolves"
  );

  t.ok(phantom.getIsDestroyed(), "has destroyed state when destroy() resolves");

  t.end();
});

test("no incorrect usage of EVT_DESTROY", async t => {
  t.plan(3);

  const phantom = new PhantomCore();

  t.throws(
    () => phantom.emit(EVT_DESTROY),
    Error,
    "throws Error if EVT_DESTROY is arbitrarily emit on instance"
  );

  t.ok(
    phantom.getHasDestroyStarted(),
    true,
    "proceeds to destroying phase once EVT_DESTROY is improperly emit"
  );

  await new Promise(resolve => phantom.once(EVT_DESTROY, resolve));

  t.ok(
    phantom.getIsDestroyed(),
    true,
    "shuts down after finishing up destroying phase"
  );

  t.end();
});

test("no subsequent usage of destroy() after full destruct", async t => {
  t.plan(1);

  const phantom = new PhantomCore();

  // Don't await
  phantom.destroy();

  await new Promise(resolve => phantom.once(EVT_DESTROY, resolve));

  await phantom.destroy();
  t.ok(true, "subsequent call to destroy is ignored");

  t.end();
});

test("multiple destroyHandler calls", async t => {
  t.plan(1);

  let i = 0;

  class TestPhantomCore extends PhantomCore {
    async destroy() {
      return super.destroy(() => {
        ++i;
      });
    }
  }

  const phantom = new TestPhantomCore();

  phantom.destroy();
  phantom.destroy();
  phantom.destroy();
  phantom.destroy();

  t.equals(i, 1, "destroy is only invoked once despite multiple calls");

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

  const retOn = phantom.on(EVT_UPDATE, () => null);

  t.ok(
    Object.is(retOn, phantom),
    "on returns a self reference to PhantomCore instance"
  );

  const retOnce = phantom.once(EVT_UPDATE, () => null);

  t.ok(
    Object.is(retOnce, phantom),
    "once returns a self reference to PhantomCore instance"
  );

  const retOff = phantom.off(EVT_UPDATE, () => null);

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
  testPhantom.registerCleanupHandler(async () => {
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
  t.plan(2);

  const phantom = new PhantomCore();

  const orderOps = [];

  phantom.registerCleanupHandler(() =>
    orderOps.push("__TESTING__-shutdown-handler-invoked")
  );

  phantom.once(EVT_DESTROY, () => {
    orderOps.push("__TESTING__-destruct-event-emitted");
  });

  await phantom.destroy();

  t.equals(
    orderOps[0],
    "__TESTING__-destruct-event-emitted",
    "EVT_DESTROY called successfully"
  );

  t.equals(
    orderOps[1],
    "__TESTING__-shutdown-handler-invoked",
    "shutdown handler invoked after EVT_DESTROY"
  );

  t.end();
});

test("shutdown handler stack", async t => {
  t.plan(3);

  const p1 = new PhantomCore();

  t.throws(
    () => {
      p1.registerCleanupHandler("something");
    },
    TypeError,
    "throws TypeError when trying to register non-function shutdown handler"
  );

  p1.registerCleanupHandler(() => {
    throw new Error("Expected error");
  });

  try {
    await p1.destroy();
  } catch (err) {
    t.ok(
      err.message === "Expected error",
      "errors in shutdown stack are thrown from the PhantomCore instance"
    );
  }

  const p2 = new PhantomCore();

  let opsRecords = [];

  p2.registerCleanupHandler(() => {
    opsRecords.push("a");
  });

  p2.registerCleanupHandler(async () => {
    await sleep(1000);

    opsRecords.push("b");
  });

  p2.registerCleanupHandler(() => {
    opsRecords.push("c");
  });

  await p2.destroy();

  t.deepEquals(
    opsRecords,
    ["c", "b", "a"],
    "shutdown functions are executed in reverse-order (LIFO) and maintain proper order if promises are used"
  );

  t.end();
});

test("unregister shutdown handler", async t => {
  t.plan(1);

  const phantom = new PhantomCore();

  let wasInvoked = false;

  const cleanupHandler = () => {
    wasInvoked = true;
  };

  phantom.registerCleanupHandler(cleanupHandler);

  phantom.unregisterCleanupHandler(cleanupHandler);

  await phantom.destroy();

  t.notOk(wasInvoked, "unregistered shutdown handler was not invoked");

  t.end();
});
