import test from "tape";
import { PhantomCore, sleep } from "../src";

test("phantom-core timers", async t => {
  t.plan(2);

  const phantom = new PhantomCore();

  await new Promise(
    resolve =>
      phantom.setTimeout(() => {
        t.ok(true, "timeout resolves");

        resolve();
      }),
    10
  );

  await new Promise(resolve => {
    let i = 0;

    const interval = phantom.setInterval(() => {
      ++i;

      if (i === 5) {
        phantom.clearInterval(interval);

        t.ok(true, "interval resolves");

        resolve();
      }
    }, 10);
  });

  t.end();
});

test("phantom-core auto-destructs timer stack", async t => {
  const phantom = new PhantomCore();

  phantom.setTimeout(() => {
    throw new Error("This should not be invoked");
  });

  phantom.setInterval(() => {
    throw new Error("This should not be invoked");
  });

  await phantom.destroy();

  await sleep(10);
});
