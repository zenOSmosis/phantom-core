const test = require("tape-async");
const PhantomCore = require("../src");
const { EVT_READY, EVT_UPDATED, EVT_DESTROYED } = PhantomCore;

/**
 * Tests instantiation and destroying of PhantomCore with the default options
 * (no options passed).
 */

test("registers and unregisters instances", async t => {
  const oCount = PhantomCore.getInstanceCount();

  const phantom = new PhantomCore();

  t.ok(
    PhantomCore.getInstanceCount() === oCount + 1,
    "increments instance count on new instance"
  );

  await phantom.destroy();

  t.ok(
    PhantomCore.getInstanceCount() === oCount,
    "decrements instance count when instance is destroyed"
  );

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
    isReady: true,
    symbol: null,
    title: null,
  });

  t.equals(phantom.getOption("testOption"), 123, "retrieves testOption option");
  t.equals(phantom.getOption("logLevel"), 4, "retrieves logLevel option");
  t.equals(phantom.getOption("symbol"), null, "retrieves symbol option");

  t.end();
});

test("get instance with symbol", t => {
  t.plan(6);

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

test("deep merge options of same type", t => {
  t.plan(1);

  // NOTE: Despite the similarities, these data structures are not the same as
  // MediaStreamTrack constraints
  const defaultOptions = {
    audio: {
      quality: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        sampleSize: 16,
      },
    },
    video: {
      resolution: {
        width: 1920,
        height: 1280,
      },
    },
  };

  const userLevelOptions = {
    audio: {
      quality: {
        autoGainControl: false,
      },
    },

    video: {
      resolution: {
        width: 640,
        height: 480,
      },
    },
  };

  t.deepEquals(PhantomCore.mergeOptions(defaultOptions, userLevelOptions), {
    audio: {
      quality: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
        sampleRate: 48000,
        sampleSize: 16,
      },
    },
    video: {
      resolution: {
        width: 640,
        height: 480,
      },
    },
  });

  t.end();
});

test("handles null options", t => {
  t.plan(2);

  const DEFAULT_OPTIONS = {
    a: 123,
    b: () => "hello",
  };

  const USER_OPTIONS = null;

  t.deepEquals(
    PhantomCore.mergeOptions(DEFAULT_OPTIONS, USER_OPTIONS),
    DEFAULT_OPTIONS,
    "accepts null user options"
  );

  t.deepEquals(
    PhantomCore.mergeOptions(null, null),
    {},
    "accepts null values for all merge options parameters"
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

test("deep merge options of altered type", t => {
  t.plan(3);

  const defaultOptions = {
    audio: true,
    video: true,
  };

  const userLevelOptions = {
    audio: {
      quality: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        sampleSize: 16,
      },
    },
    video: {
      resolution: {
        width: 1920,
        height: 1280,
      },
    },
  };

  t.deepEquals(
    PhantomCore.mergeOptions(defaultOptions, {
      audio: userLevelOptions.audio,
    }),
    {
      audio: {
        quality: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          sampleSize: 16,
        },
      },
      video: true,
    },
    "changes audio from boolean to object type"
  );

  t.deepEquals(
    PhantomCore.mergeOptions(defaultOptions, {
      video: userLevelOptions.video,
    }),
    {
      audio: true,
      video: {
        resolution: {
          width: 1920,
          height: 1280,
        },
      },
    },
    "changes video from boolean to object type"
  );

  t.deepEquals(
    PhantomCore.mergeOptions(defaultOptions, userLevelOptions),
    {
      audio: {
        quality: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          sampleSize: 16,
        },
      },
      video: {
        resolution: {
          width: 1920,
          height: 1280,
        },
      },
    },
    "merges multiple type changes"
  );

  t.end();
});

test("determines class name", async t => {
  const phantom1 = new PhantomCore();

  t.ok(
    phantom1.getClassName() === "PhantomCore",
    "determines its own class name"
  );

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
  const phantom = new PhantomCore();

  t.ok(phantom.getIsReady(), "ready by default");

  await phantom.onceReady();
  t.ok(true, "after first onceReady");

  await phantom.onceReady();
  t.ok(true, "after second onceReady");

  phantom.destroy();

  t.end();
});

test("emits EVT_READY", async t => {
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

test("same instance detection", async t => {
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

  phantom.destroy();
  t.ok(phantom.getInstanceUptime() === 0, "destroyed phantom returns 0 uptime");

  t.end();
});

test("events and destruct", async t => {
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
      "destroy state is true after EVT_DESTROYED emit"
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

test("prevents methods from being called after destroyed", async t => {
  class TestDestroyer extends PhantomCore {
    a() {
      throw new Error("a() was called");
    }
  }

  const phantom = new TestDestroyer();

  phantom.destroy();

  phantom.a();

  t.end();
});
