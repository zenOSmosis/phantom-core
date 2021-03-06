const test = require("tape");
const PhantomCore = require("../src");
const { EVT_READY, EVT_NO_INIT_WARN } = PhantomCore;

/**
 * Tests instantiation and destroying of PhantomCore with the default options
 * (no options passed).
 */

test("instantiates async", async t => {
  t.plan(7);

  // FIXME: (jh) Remove after isReady has been removed
  const p1 = new PhantomCore({ isReady: false });
  const p2 = new PhantomCore({ isAsync: true });
  t.deepEquals(
    p1.getOptions(),
    p2.getOptions(),
    "older isReady[false] and newer isAsync[true] produce same options"
  );

  const phantom = new PhantomCore({
    isAsync: true,
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

  const phantom1 = new PhantomCore({ isReady: false });
  await phantom1.destroy();
  t.ok(true, "able to destruct immediately after declaration of async init");

  t.end();
});

test("_init cannot be called more than once", async t => {
  t.plan(1);

  class TestAsyncPhantom extends PhantomCore {
    constructor() {
      super({
        isAsync: true,
      });

      this._initIdx = -1;

      this._init();

      t.throws(
        () => this._init(),
        ReferenceError,
        "Second call to this._init() throws reference error"
      );
    }

    async _init() {
      ++this._initIdx;

      if (this._initIdx > 0) {
        throw new Error("_init called more than once");
      }

      return super._init();
    }
  }

  new TestAsyncPhantom();

  t.end();
});

test("_init is discarded for non-async instances", async t => {
  t.plan(2);

  class TestSyncPhantom extends PhantomCore {
    _init() {
      throw new Error("Should not get here");
    }
  }

  const p = new TestSyncPhantom();

  t.equals(typeof p._init, "undefined", "_init is undefined with sync type");

  t.throws(
    () => p._init(),
    TypeError,
    "_init call throws TypeError when sync type"
  );

  t.end();
});
