const test = require("tape");
const { PhantomServiceCore, PhantomServiceManager } = require("../../src");

test("circular service constructors", async t => {
  t.plan(2);

  class TestServiceB extends PhantomServiceCore {
    constructor({ ...args }) {
      super({ ...args });

      this._testServiceA = this.useServiceClass(TestServiceA);
    }
  }

  class TestServiceA extends PhantomServiceCore {
    constructor({ ...args }) {
      super({ ...args });

      this._testServiceB = this.useServiceClass(TestServiceB);
    }
  }

  const serviceManager = new PhantomServiceManager();

  try {
    serviceManager.startServiceClass(TestServiceA);
  } catch (err) {
    if (
      err instanceof RangeError ||
      /** Firefox */ err instanceof InternalError
    ) {
      t.ok(
        "cannot initialize services with circular dependencies in their constructors"
      );
    }
  }

  await serviceManager.destroy();

  t.equals(
    [...serviceManager._pendingServiceClassInstanceSet].length,
    0,
    "pending service class instance set is reset during destruct"
  );

  t.end();
});
