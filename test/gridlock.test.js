import test from "tape";
import PhantomCore, { EVT_DESTROY_STACK_TIMED_OUT } from "../src";

test("gridlock / awaiting circular destructs do not interfere with shutdown process", async t => {
  t.plan(2);

  const p1 = new PhantomCore();
  const p2 = new PhantomCore();

  await Promise.all([
    p1.destroy(async () => {
      await p2.destroy();
    }),

    p2.destroy(async () => {
      await p1.destroy();
    }),
  ]);

  t.ok(p1.UNSAFE_getIsDestroyed(), "p1 is destructed");

  t.ok(p2.UNSAFE_getIsDestroyed(), "p2 is destructed");

  t.end();
});

test("gridlock / forced timeout error", async t => {
  t.plan(1);

  const p1 = new PhantomCore();

  await p1.destroy(async () => {
    await new Promise(resolve => {
      p1.once(EVT_DESTROY_STACK_TIMED_OUT, () => {
        t.ok(
          "EVT_DESTROY_STACK_TIMED_OUT if destroy handler does not complete in a reasonable amount of time"
        );

        resolve();
      });
    });
  });

  t.end();
});
