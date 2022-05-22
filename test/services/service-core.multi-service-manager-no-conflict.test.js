import test from "tape";
import { PhantomServiceCore, PhantomServiceManager } from "../../src";

class TestServiceA extends PhantomServiceCore {}
class TestServiceB extends PhantomServiceCore {}

test("multi-service-manager no-conflict", async t => {
  t.plan(8);

  const serviceManagerA = new PhantomServiceManager();
  const serviceManagerB = new PhantomServiceManager();

  serviceManagerA.startServiceClass(TestServiceA);
  serviceManagerA.startServiceClass(TestServiceB);

  serviceManagerB.startServiceClass(TestServiceA);
  serviceManagerB.startServiceClass(TestServiceB);

  t.equals(
    serviceManagerA.getServiceInstance(TestServiceA),
    serviceManagerA.getServiceInstance(TestServiceA),
    "testServiceA matches testServiceA using same manager"
  );

  t.notEquals(
    serviceManagerA.getServiceInstance(TestServiceA),
    serviceManagerA.getServiceInstance(TestServiceB),
    "testServiceA does not match testServiceB using same manager"
  );

  t.notEquals(
    serviceManagerA.getServiceInstance(TestServiceA),
    serviceManagerB.getServiceInstance(TestServiceA),
    "testServiceA does not match testServiceA using different managers"
  );

  t.notEquals(
    serviceManagerB.getServiceInstance(TestServiceB),
    serviceManagerA.getServiceInstance(TestServiceB),
    "testServiceB does not match testServiceB using different managers"
  );

  t.equals(
    serviceManagerB.getServiceInstance(TestServiceB),
    serviceManagerB.getServiceInstance(TestServiceB),
    "testServiceB matches testServiceB using same manager"
  );

  t.notEquals(
    serviceManagerB.getServiceInstance(TestServiceA),
    serviceManagerA.getServiceInstance(TestServiceA),
    "testServiceA does not match testServiceA using different managers"
  );

  t.equals(
    serviceManagerA.getServiceClasses().length,
    serviceManagerB.getServiceClasses().length,
    "both managers report same number of classes before a service is destructed"
  );

  await serviceManagerB.getServiceInstance(TestServiceB).destroy();

  t.notEquals(
    serviceManagerA.getServiceClasses().length,
    serviceManagerB.getServiceClasses().length,
    "both managers report different number of classes after a service is destructed"
  );

  t.end();
});
