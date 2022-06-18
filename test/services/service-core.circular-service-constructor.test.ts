import test from "tape";
import { PhantomServiceCore, PhantomServiceManager } from "../../src";

test("circular service constructors", async t => {
  t.plan(2);

  class TestServiceB extends PhantomServiceCore {
    protected _testServiceA = this.useServiceClass(TestServiceA);
  }

  class TestServiceA extends PhantomServiceCore {
    protected _testServiceB = this.useServiceClass(TestServiceB);
  }

  const serviceManager = new PhantomServiceManager();

  try {
    serviceManager.startServiceClass(TestServiceA);
  } catch (err) {
    if (
      err instanceof RangeError ||
      // Test error
      // @ts-ignore
      /** Firefox */ (typeof InternalError !== "undefined" &&
        // Test error
        // @ts-ignore
        err instanceof InternalError)
    ) {
      t.ok(
        "cannot initialize services with circular dependencies in their constructors"
      );
    }
  }

  await serviceManager.destroy();

  t.equals(
    // Test error
    // @ts-ignore
    [...serviceManager._pendingServiceClassInstanceSet].length,
    0,
    "pending service class instance set is reset during destruct"
  );

  t.end();
});
