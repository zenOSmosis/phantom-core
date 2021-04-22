const test = require("tape-async");
const PhantomBase = require("../src");
const { EVT_READY, EVT_UPDATED, EVT_DESTROYED } = require("../src");

/**
 * Tests instantiation and destroying of PhantomBase with the default options
 * (no options passed).
 */

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
  const phantom1Uuid = phantom1.getUuid();

  const phantom2 = new PhantomBase();
  const phantom2Uuid = phantom2.getUuid();

  t.ok(phantom1.getIsSameInstance(phantom1), "can identify its own instance");

  t.ok(
    PhantomBase.getInstanceWithUuid(phantom1Uuid).getIsSameInstance(phantom1)
  );

  t.notOk(
    phantom1.getIsSameInstance(phantom2),
    "knows other instance is not its own"
  );

  t.ok(
    PhantomBase.getInstanceWithUuid(phantom2Uuid).getIsSameInstance(phantom2)
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

  t.end();
});
