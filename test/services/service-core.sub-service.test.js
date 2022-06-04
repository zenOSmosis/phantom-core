import test from "tape";
import { PhantomServiceCore, PhantomServiceManager } from "../../src";

test("sub-service", async t => {
  t.plan(5);

  class TestSubService extends PhantomServiceCore {}

  class TestService extends PhantomServiceCore {
    constructor({ ...args }) {
      super({ ...args });

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

  serviceManager.startServiceClass(TestService);

  t.equals(
    serviceManager.getServiceClasses().length,
    2,
    "adding duplicate sub-service does not re-instantiate"
  );

  const testService = serviceManager.getServiceInstance(TestService);

  await testService.destroy();

  // FIXME: This handling might need to change in a future version, using
  // dependency counters, where a sub-service can still be a child of at
  // least one service, and if all parent services are destructed, then
  // the child destructs as well.
  t.equals(
    serviceManager.getServiceClasses().length,
    1,
    "destructing service class does not destruct sub-services"
  );

  t.end();
});
