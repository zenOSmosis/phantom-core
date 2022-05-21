import test from "tape";
import { sleep } from "../src";

import FunctionStack, {
  FUNCTION_STACK_OPS_ORDER_FIFO,
  FUNCTION_STACK_OPS_ORDER_LIFO,
} from "../src/FunctionStack";

test("uses default FIFO ops order", t => {
  t.plan(1);

  const stack = new FunctionStack();

  t.equals(stack.getOpsOrder(), FUNCTION_STACK_OPS_ORDER_FIFO);

  t.end();
});

test("rejects invalid ops order", t => {
  t.plan(1);

  t.throws(
    () => new FunctionStack("invalid-op-mode"),
    ReferenceError,
    "does not accept invalid op mode"
  );

  t.end();
});

test("function stack FIFO ops order", async t => {
  t.plan(1);

  const stack = new FunctionStack(FUNCTION_STACK_OPS_ORDER_FIFO);

  const data = [];

  stack.push(() => data.push("a"));
  stack.push(async () => {
    await sleep(100);
    data.push("b");
  });
  stack.push(() => data.push("c"));

  await stack.exec();

  t.deepEquals(data, ["a", "b", "c"]);

  t.end();
});

test("function stack LIFO ops order", async t => {
  t.plan(1);

  const stack = new FunctionStack(FUNCTION_STACK_OPS_ORDER_LIFO);

  const data = [];

  stack.push(() => data.push("a"));
  stack.push(async () => {
    await sleep(100);
    data.push("b");
  });
  stack.push(() => data.push("c"));

  await stack.exec();

  t.deepEquals(data, ["c", "b", "a"]);

  t.end();
});

test("function stack clear ops", async t => {
  t.plan(1);

  const stack = new FunctionStack(FUNCTION_STACK_OPS_ORDER_LIFO);

  const data = [];

  stack.push(() => data.push("a"));
  stack.push(async () => {
    await sleep(100);
    data.push("b");
  });
  stack.push(() => data.push("c"));

  stack.clear();

  await stack.exec();

  t.deepEquals(data, []);

  t.end();
});

test("function stack queue depth and stack element removal", async t => {
  t.plan(3);

  const stack = new FunctionStack(FUNCTION_STACK_OPS_ORDER_LIFO);

  stack.push(() => null);
  stack.push(async () => {
    await sleep(100);
    return null;
  });
  stack.push(() => null);

  t.equals(stack.getQueueDepth(), 3);

  const removable = () => null;

  stack.push(removable);

  t.equals(stack.getQueueDepth(), 4);

  stack.remove(removable);

  t.equals(stack.getQueueDepth(), 3);

  t.end();
});
