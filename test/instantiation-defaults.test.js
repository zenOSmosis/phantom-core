const test = require("tape-async");
const PhantomBase = require("../src");
const { EVT_READY, EVT_UPDATED, EVT_DESTROYED } = require("../src");

/**
 * Tests instantiation and destroying of PhantomBase with the default options
 * (no options passed).
 */

test("registers and unregisters instances", async t => {
  const oCount = PhantomBase.getInstanceCount();

  const phantom = new PhantomBase();

  t.ok(
    PhantomBase.getInstanceCount() === oCount + 1,
    "increments instance count on new instance"
  );

  await phantom.destroy();

  t.ok(
    PhantomBase.getInstanceCount() === oCount,
    "decrements instance count when instance is destroyed"
  );
});

test("determines class name", async t => {
  const phantom = new PhantomBase();

  t.ok(
    phantom.getClassName() === "PhantomBase",
    "determines its own class name"
  );

  class Phantom2 extends PhantomBase {}

  const phantom2 = new Phantom2();

  t.ok(
    phantom2.getClassName() === "Phantom2",
    "extensions know their class name"
  );
});

test("onceReady handling", async t => {
  const phantom = new PhantomBase();

  t.ok(phantom.getIsReady(), "ready by default");

  await phantom.onceReady();
  t.ok(true, "after first onceReady");

  await phantom.onceReady();
  t.ok(true, "after second onceReady");

  t.end();
});

test("emits EVT_READY", async t => {
  const phantom = new PhantomBase();

  await new Promise(resolve => {
    phantom.once(EVT_READY, () => {
      t.ok(true, "emits EVT_READY after init");

      resolve();
    });
  });

  t.end();
});

test("same instance detection", async t => {
  const phantom1 = new PhantomBase();
  const phantom1UUID = phantom1.getUUID();

  const phantom2 = new PhantomBase();
  const phantom2UUID = phantom2.getUUID();

  t.ok(phantom1.getIsSameInstance(phantom1), "can identify its own instance");

  t.ok(
    PhantomBase.getInstanceWithUUID(phantom1UUID).getIsSameInstance(phantom1)
  );

  t.notOk(
    phantom1.getIsSameInstance(phantom2),
    "knows other instance is not its own"
  );

  t.ok(
    PhantomBase.getInstanceWithUUID(phantom2UUID).getIsSameInstance(phantom2)
  );
});

test("determines instance uptime", async t => {
  const phantom = new PhantomBase();

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
});

test("events and destruct", async t => {
  const phantom = new PhantomBase();

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
  });

  await phantom.destroy();
  t.ok(true, "successfully destroys");

  t.ok(
    phantom.getIsDestroyed(),
    "determines that post destroyed state is destroyed"
  );

  phantom.emit("mock-event");
  t.ok(
    phantom.getListenerCount("mock-event") === 0,
    "removes event listeners after destroying"
  );

  t.ok(
    undefined === (await phantom.destroy()),
    "subsequent calls to destroy are ignored"
  );

  t.end();
});
