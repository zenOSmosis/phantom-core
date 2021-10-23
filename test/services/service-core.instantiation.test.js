const test = require("tape");
const PhantomCore = require("../../src");
const { PhantomServiceCore, PhantomServiceManager } = PhantomCore;

class TestService extends PhantomServiceCore {}

test("service instantiation", async t => {
  t.plan(10);

  const serviceManager = new PhantomServiceManager();

  t.throws(
    () => {
      serviceManager.startServiceClass(PhantomCore);
    },
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
    () => {
      new PhantomServiceCore({});
    },
    ReferenceError,
    "services must be instantiated by a manager"
  );

  t.throws(() => {
    serviceManager.startServiceClass(new PhantomServiceCore({}));
  });

  serviceManager.startServiceClass(TestService);

  t.deepEquals(
    serviceManager.getServiceClasses(),
    [TestService],
    "TestService class is included in getServiceClasses call"
  );

  const testServiceInstance = serviceManager.getServiceInstance(TestService);

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

  const extendedTestServiceInstance =
    serviceManager.getServiceInstance(ExtendedTestService);

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

  const testServiceInstance = serviceManager.getServiceInstance(TestService);

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
