const test = require("tape-async");
const PhantomCore = require("../src");
const { EVT_READY, EVT_DESTROYED } = PhantomCore;

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
  t.plan(1);

  const phantom = new PhantomCore({
    testOption: 123,
  });

  t.deepEquals(phantom.getOptions(), {
    testOption: 123,
    logLevel: 2,
    isReady: true,
  });

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
