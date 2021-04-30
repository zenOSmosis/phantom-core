const test = require("tape-async");
const PhantomBase = require("../src");
const { EVT_READY, EVT_NO_INIT_WARN } = PhantomBase;

/**
 * Tests instantiation and destroying of PhantomBase with the default options
 * (no options passed).
 */

test("instantiates async", async t => {
  t.plan(5);

  const phantom = new PhantomBase({
    isReady: false,
  });

  await new Promise(resolve =>
    phantom.once(EVT_NO_INIT_WARN, () => {
      t.ok(true, "received EVT_NO_INIT_WARN after a reasonable amount of time");

      resolve();
    })
  );

  phantom.once(EVT_READY, () => {
    t.ok(true, "emits EVT_READY after async init");
  });

  t.notOk(phantom.getIsReady(), "not ready before init");

  // This is a protected method which shouldn't normally be called by the implementer
  await Promise.all([
    // This is a protected method which shouldn't normally be called by the implementer
    phantom._init(),

    // Called right after _init
    phantom.onceReady(),
  ]);

  t.ok(
    undefined === (await phantom.onceReady()),
    "subsequent calls to onceReady pass through"
  );

  t.ok(phantom.getIsReady(), "ready after init");

  phantom.destroy();

  t.end();
});
