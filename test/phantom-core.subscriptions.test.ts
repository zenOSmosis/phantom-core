import test from "tape";
import PhantomCore, { EVT_UPDATE } from "../src";
import sinon from "sinon";

test("subscribe / unsubscribe -- default event names", async t => {
  t.plan(3);

  const p = new PhantomCore();

  const origUpdateListeners = p.listeners(EVT_UPDATE);

  const unsubscribe = p.subscribe(() => null);

  t.equals(typeof unsubscribe, "function");

  t.equals(p.listeners(EVT_UPDATE).length, origUpdateListeners.length + 1);

  unsubscribe();

  t.equals(p.listeners(EVT_UPDATE).length, origUpdateListeners.length);

  await p.destroy();

  t.end();
});

test("subscribes to multiple events", async t => {
  t.plan(7);

  const p = new PhantomCore();

  const origAListeners = p.listeners("mock-a");
  const origBListeners = p.listeners("mock-b");
  const origCListeners = p.listeners("mock-c");

  const listenerSpy = sinon.spy((data: any) => null);

  const unsubscribe = p.subscribe(listenerSpy, ["mock-a", "mock-b", "mock-c"]);

  t.equals(p.listeners("mock-a").length, origAListeners.length + 1);
  t.equals(p.listeners("mock-b").length, origBListeners.length + 1);
  t.equals(p.listeners("mock-c").length, origCListeners.length + 1);

  p.emit("mock-a", "test-data-a");

  t.ok(listenerSpy.calledOnceWith("test-data-a"));

  unsubscribe();

  t.equals(p.listeners("mock-a").length, origAListeners.length);
  t.equals(p.listeners("mock-b").length, origBListeners.length);
  t.equals(p.listeners("mock-c").length, origCListeners.length);

  await p.destroy();

  t.end();
});

test("auto-unsubscribe on destruct", async t => {
  t.plan(1);

  t.teardown(() => {
    sinon.restore();
  });

  const p = new PhantomCore();
  const unsubscribe = p.subscribe(() => null);
  const cleanupSpy = sinon.spy(p, "unregisterCleanupHandler");
  await p.destroy();

  t.ok(
    cleanupSpy.calledWith(unsubscribe),
    "cleanup handler called with unsubscribe method"
  );

  t.end();
});
