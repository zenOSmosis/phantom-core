import test from "tape";
import { sleep } from "../src";

import TimerStack from "../src/stacks/TimerStack";

test("invokes timeout", async t => {
  t.plan(4);

  const stack = new TimerStack();

  t.equals(stack.getTimeoutStack().length, 0, "starts with 0 timers in stack");

  await new Promise(resolve => {
    stack.setTimeout(() => {
      t.ok("executed timeout in stack", "executes timeout in stack");

      t.equals(
        stack.getTimeoutStack().length,
        0,
        "decrements timeout in stack after complete"
      );

      resolve();
    }, 10);

    t.equals(stack.getTimeoutStack().length, 1, "adds 1 timer to stack");
  });

  t.end();
});

test("stops given timeout in stack", async t => {
  t.plan(2);

  const stack = new TimerStack();

  const TIMER_LENGTH = 8;
  const REMOVE_IDX = 3;

  const timers = [];
  const completedIndexes = [];

  for (const i = 0; i < TIMER_LENGTH; i++) {
    timers.push(
      stack.setTimeout(() => {
        if (i === REMOVE_IDX) {
          throw new Error("Timeout should not execute on REMOVE_IDX");
        }

        completedIndexes.push(i);
      }, 10)
    );
  }

  stack.clearTimeout(timers[3]);

  await sleep(20);

  t.ok(!completedIndexes.includes(3), "does not include removed timer index");
  t.ok(
    completedIndexes.length === TIMER_LENGTH - 1,
    "accounts for removed timer"
  );

  t.end();
});

test("stops remaining timeouts from completing when stack is destructed", async t => {
  t.plan(2);

  const stack = new TimerStack();

  const TIMER_LENGTH = 8;

  for (const i = 0; i < TIMER_LENGTH; i++) {
    stack.setTimeout(() => {
      throw new Error("This timeout should not execute");
    });
  }

  t.equals(stack.getTimeoutStack().length, 8);

  await stack.destroy();

  t.equals(stack.getTimeoutStack().length, 0);

  t.end();
});

test("invokes and clears interval", async t => {
  t.plan(3);

  const stack = new TimerStack();

  t.equals(stack.getIntervalStack().length, 0, "starts with 0 timers in stack");

  await new Promise(resolve => {
    let iterations = 0;

    const interval = stack.setInterval(() => {
      ++iterations;

      if (iterations === 5) {
        t.ok("made it to 5 interval iterations");

        stack.clearInterval(interval);

        resolve();
      }

      if (iterations > 5) {
        throw new Error("Did not expect more than 5 iterations");
      }
    }, 10);

    t.equals(stack.getIntervalStack().length, 1, "adds 1 timer to stack");
  });

  t.end();
});

test("stops remaining intervals from completing when stack is destructed", async t => {
  t.plan(2);

  const stack = new TimerStack();

  const TIMER_LENGTH = 8;

  for (const i = 0; i < TIMER_LENGTH; i++) {
    stack.setInterval(() => {
      throw new Error("This timeout should not execute");
    });
  }

  t.equals(stack.getIntervalStack().length, 8);

  await stack.destroy();

  t.equals(stack.getIntervalStack().length, 0);

  t.end();
});
