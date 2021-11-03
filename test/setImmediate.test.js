const test = require("tape");
require("../src");

test("setImmediate", async t => {
  t.plan(6);

  // NOTE: This sequence is wrapped in a promise so that we can await the final
  // setImmediate call
  await new Promise(resolve => {
    let i = -1;

    // nextTick runs at the end of the current event loop; setImmediate runs at
    // the beginning; at the end of the event loop, i should be equal to 2,
    // before any of the setImmediate calls run
    if (process && process.nextTick) {
      process.nextTick(() => {
        if (i !== 2) {
          throw new Error("i should be equal to 2 on next tick");
        }
      });
    }

    global.setImmediate(() => {
      ++i;

      t.ok(i === 3);
    });

    ++i;
    t.ok(i === 0);

    if (process && process.nextTick) {
      process.nextTick(() => {
        if (i !== 2) {
          throw new Error("i should be equal to 2 on next tick");
        }
      });
    }

    global.setImmediate(() => {
      ++i;

      t.ok(i === 4);
    });

    ++i;
    t.ok(i === 1);

    if (process && process.nextTick) {
      process.nextTick(() => {
        if (i !== 2) {
          throw new Error("i should be equal to 2 on next tick");
        }
      });
    }

    global.setImmediate(() => {
      ++i;

      t.ok(i === 5);

      resolve();
    });

    if (process && process.nextTick) {
      process.nextTick(() => {
        if (i !== 2) {
          throw new Error("i should be equal to 2 on next tick");
        }
      });
    }

    ++i;
    t.ok(i === 2);
  });

  t.end();
});
