const test = require("tape-async");
const PhantomBase = require("../src");
const { EVT_READY, EVT_NO_INIT_WARN } = require("../src");

/**
 * Tests instantiation and destroying of PhantomBase with the default options
 * (no options passed).
 */

test("instantiates async", async t => {
  t.plan(3);

  const phantom = new PhantomBase({
    isReady: false,
  });

  await new Promise(resolve =>
    phantom.once(EVT_NO_INIT_WARN, () => {
      t.ok(true, "received EVT_NO_INIT_WARN after a reasonable amount of time");

      resolve();
    })
  );

  t.notOk(phantom.getIsReady(), "not ready before init");

  // This is a protected method which shouldn't normally be called by the implementer
  await phantom._init();

  t.ok(phantom.getIsReady(), "ready after init");
});
