import test from "tape";
import PhantomCore, {
  PhantomServiceCore,
  PhantomServiceManager,
} from "../../src";

class TestService extends PhantomServiceCore {}

test("service instantiation", async t => {
  t.plan(13);

  const serviceManager = new PhantomServiceManager();

  t.throws(
    () =>
      // Test error
      // @ts-ignore
      serviceManager.startServiceClass(PhantomCore),
    TypeError,
    "services must derive from PhantomServiceCore"
  );

  t.throws(
    () => {
      serviceManager.startServiceClass(PhantomServiceCore);
    },
    TypeError,
    "services must derive from PhantomServiceCore but cannot be PhantomServiceCore itself"
  );

  t.throws(
    () =>
      // Test error
      // @ts-ignore
      new PhantomServiceCore({}),
    ReferenceError,
    "services must be instantiated by a manager"
  );

  t.throws(
    () =>
      // Test error
      // @ts-ignore
      serviceManager.startServiceClass(new PhantomServiceCore({})),
    ReferenceError,
    "startServiceClass does not accept already instantiated service"
  );

  serviceManager.startServiceClass(TestService);

  t.deepEquals(
    serviceManager.getServiceClasses(),
    [TestService],
    "TestService class is included in getServiceClasses call"
  );

  t.ok(
    Array.isArray(serviceManager.getServiceClasses()),
    "getServiceClasses() returns an array"
  );

  const testServiceInstance = serviceManager.getServiceInstance(
    TestService
  ) as TestService;

  t.ok(
    testServiceInstance instanceof TestService,
    "TestService instance is available in getServiceInstance call"
  );

  t.equals(
    serviceManager.getServiceClasses().length,
    1,
    "serviceManager reports one service class"
  );

  serviceManager.startServiceClass(TestService);
  serviceManager.startServiceClass(TestService);
  serviceManager.startServiceClass(TestService);
  serviceManager.startServiceClass(TestService);

  t.equals(
    serviceManager.getServiceClasses().length,
    1,
    "serviceManager reports one service class after duplicate service start attempts"
  );

  class ExtendedTestService extends TestService {}

  serviceManager.startServiceClass(ExtendedTestService);

  t.equals(
    serviceManager.getServiceClasses().length,
    2,
    "serviceManager reports two service classes after adding in new service"
  );

  const extendedTestServiceInstance = serviceManager.getServiceInstance(
    ExtendedTestService
  ) as ExtendedTestService;

  t.notOk(
    extendedTestServiceInstance.getIsReady(),
    "service is not ready by default"
  );

  await extendedTestServiceInstance.onceReady();

  t.ok(
    extendedTestServiceInstance.getIsReady(),
    "service is ready once it emits ready event"
  );

  await serviceManager.destroy();

  t.ok(
    serviceManager.getIsDestroyed() &&
      testServiceInstance.getIsDestroyed() &&
      extendedTestServiceInstance.getIsDestroyed(),
    "TestService instance is destructed when ServiceManager is destructed"
  );

  t.end();
});

test("arbitrary service stopping", async t => {
  t.plan(2);

  const serviceManager = new PhantomServiceManager();
  serviceManager.startServiceClass(TestService);

  t.equals(serviceManager.getServiceClasses().length, 1);

  const testServiceInstance = serviceManager.getServiceInstance(
    TestService
  ) as TestService;

  await testServiceInstance.destroy();

  t.equals(serviceManager.getServiceClasses().length, 0);

  t.end();
});

test("invalid service constructor", async t => {
  t.plan(2);

  const serviceManager = new PhantomServiceManager();

  class InvalidService1 extends PhantomServiceCore {
    // NOTE: Notice args are not passed through
    constructor() {
      // Test error
      // @ts-ignore
      super();
    }
  }

  t.throws(
    () => {
      serviceManager.startServiceClass(InvalidService1);
    },
    TypeError,
    "serviceManager throws TypeError when trying to instantiate service without passed args."
  );

  class InvalidService2 extends PhantomServiceCore {
    // NOTE: Notice object is set in constructor, but still not passed through to super
    constructor({}) {
      // Test error
      // @ts-ignore
      super();
    }
  }

  t.throws(
    () => {
      serviceManager.startServiceClass(InvalidService2);
    },
    TypeError,
    "serviceManager throws TypeError when trying to instantiate service without passed args (version 2)."
  );

  t.end();
});
