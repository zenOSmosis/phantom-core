const test = require("tape-async");
const { PhantomServiceCore, PhantomServiceManager } = require("../../src");

test("service state", async t => {
  t.plan(1);

  class TestService extends PhantomServiceCore {
    constructor() {
      super({
        someInitialFirstStateBoolean: true,
      });
    }
  }

  const serviceManager = new PhantomServiceManager();

  serviceManager.startServiceClass(TestService);

  t.deepEquals(
    serviceManager.getServiceInstance(TestService).getState(),
    {
      someInitialFirstStateBoolean: true,
    },
    "state is able to be obtained from linked service"
  );

  t.end();
});
