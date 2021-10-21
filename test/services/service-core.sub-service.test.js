const test = require("tape-async");
const { PhantomServiceCore, PhantomServiceManager } = require("../../src");

test("sub-service", async t => {
  t.plan(4);

  class TestSubService extends PhantomServiceCore {}

  class TestService extends PhantomServiceCore {
    constructor() {
      super();

      t.throws(
        () => {
          this.useServiceClass(TestService);
        },
        TypeError,
        "service cannot start instance of itself"
      );

      // Start service class within service
      const subServiceInstance = this.useServiceClass(TestSubService);

      t.ok(
        subServiceInstance instanceof TestSubService,
        "useServiceClass returns sub service instance"
      );
    }
  }

  const serviceManager = new PhantomServiceManager();

  serviceManager.startServiceClass(TestService);

  t.equals(
    serviceManager.getServiceClasses().length,
    2,
    "service manager reports two services after automatic start of sub-service"
  );

  // TODO: Add test to ensure that trying to start a service class more than once does not run up the numbers

  const testService = serviceManager.getServiceInstance(TestService);

  await testService.destroy();

  // TODO: Should this be changed
  t.equals(
    serviceManager.getServiceClasses().length,
    1,
    "destructing service class does not destruct sub-services"
  );

  t.end();
});
