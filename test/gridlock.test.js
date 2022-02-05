const test = require("tape");
const PhantomCore = require("../src");
const { EVT_DESTROY_STACK_TIMED_OUT, sleep } = PhantomCore;

class TestGridLockPhantom extends PhantomCore {}

// If two PhantomCore instances await themselves to destruct, they will never
// destruct due to circular locking
test("gridlock (awaiting circular destruct)", async t => {
  t.plan(3);

  const p1 = new TestGridLockPhantom();
  const p2 = new TestGridLockPhantom();

  await Promise.race([
    p1.destroy(async () => {
      await p2.destroy();
    }),

    p2.destroy(async () => {
      await p1.destroy();
    }),

    Promise.all([
      new Promise(resolve => {
        p1.once(EVT_DESTROY_STACK_TIMED_OUT, () => {
          resolve();
        });
      }),

      new Promise(resolve => {
        p2.once(EVT_DESTROY_STACK_TIMED_OUT, () => {
          resolve();
        });
      }),
    ]),
  ]);

  t.ok(true, "emits EVT_DESTROY_STACK_TIMED_OUT in gridlock situation");

  // These situations are tricky; p1 awaits p2 to be destroyed, but is never
  // destroyed itself
  //
  // FIXME: (jh) This could be handled a bit better but the tests are currently
  // running for consistency. Real-world usage should check with
  // p1.getIsDestroying() before trying to destroy
  t.notOk(p1.getIsDestroyed(), "p1 is not destructed");

  t.ok(p2.getIsDestroyed(), "p2 is destructed");

  t.end();
});

test("non-gridlock (non-awaiting circular destruct)", async t => {
  t.plan(3);

  const p3 = new TestGridLockPhantom();
  const p4 = new TestGridLockPhantom();

  p3.once(EVT_DESTROY_STACK_TIMED_OUT, () => {
    reject();

    throw new Error("EVT_DESTROY_STACK_TIMED_OUT should not occur");
  });

  p4.once(EVT_DESTROY_STACK_TIMED_OUT, () => {
    reject();

    throw new Error("EVT_DESTROY_STACK_TIMED_OUT should not occur");
  });

  await Promise.all([
    p3.destroy(() => {
      p4.destroy();
    }),

    p4.destroy(() => {
      p3.destroy();
    }),
  ]);

  t.ok(true, "non-awaiting circular destructs do not lock themselves up");
  t.ok(p3.getIsDestroyed(), "p3 is destructed");
  t.ok(p4.getIsDestroyed(), "p4 is destructed");

  t.end();
});
