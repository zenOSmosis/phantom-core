import test from "tape";
import PhantomCore, { EVT_UPDATE } from "../src";
import sinon from "sinon";

test("subscribe / unsubscribe", async t => {
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
