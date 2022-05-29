import test from "tape";
import { EventEmitter } from "events";
import CommonEventEmitter from "../src/CommonEventEmitter";
import PhantomCore, {
  PhantomCollection,
  PhantomServiceCore,
  PhantomServiceManager,
  consume,
  getUnixTime,
  getUptime,
  getClassName,
  getIsNodeJS,
  getSuperClass,
  getClassInheritance,
  getClassInstancePropertyNames,
  sleep,
  performance,
  enumToNumericIndexedObject,
  LogLevel,
} from "../src";
import PhantomCoreUnwatched from "../src/PhantomCore/PhantomCore.base";
import _DestructibleEventEmitter from "../src/_DestructibleEventEmitter";

test("consume", t => {
  t.plan(7);

  t.equals(consume(), undefined);
  t.equals(consume({ foo: 123 }), undefined);
  t.equals(consume(1), undefined);
  t.equals(consume(0), undefined);
  t.equals(consume(new Promise(resolve => resolve())), undefined);
  t.equals(consume(true), undefined);
  t.equals(consume(false), undefined);

  t.end();
});

test("unix time", async t => {
  t.plan(9);

  const timeStart = getUnixTime();

  // NOTE (jh): Discovered that NaN type is a number, so doing parseInt check
  t.equals(
    parseInt(timeStart, 10),
    timeStart,
    "getUnixTime() returns a number"
  );

  t.equals(
    timeStart.toString().length,
    `1645556315`.length,
    "getUnixTime() retrieves a number in acceptable time range"
  );

  t.ok(
    timeStart > 1645556315,
    'getUnixTime() equates to a value more recent than "Tue Feb 22 2022 12:58:35 GMT-0600 (Central Standard Time)"'
  );

  const uptimeStart = getUptime();

  t.equals(
    parseInt(uptimeStart, 10),
    uptimeStart,
    "getUptime() returns a number"
  );

  // Wait at least a second to ensure seconds clock up as expected
  await new Promise(resolve => setTimeout(resolve, 1000));

  t.ok(getUnixTime() > timeStart, "unixTime increments as expected");
  t.ok(getUptime() > uptimeStart, "uptime increments as expected");

  const phantom = new PhantomCore();

  t.equals(
    phantom.getInstanceUptime(),
    0,
    "new phantom instance uptime starts at 0"
  );

  // Due to previous awaits, phantom instance uptime shouldn't equal current (non-phantom) getUptime()
  t.notEquals(
    phantom.getInstanceUptime(),
    getUptime(),
    "phantom instance uptime does not equal getUptime after greater than one second await"
  );

  await new Promise(resolve => setTimeout(resolve, 1000));

  t.ok(
    phantom.getInstanceUptime() > 0,
    "phantom instance uptime increments as expected"
  );

  await phantom.destroy();

  t.end();
});

test("class name", t => {
  t.plan(10);
  t.equals(
    getClassName(CommonEventEmitter),
    "CommonEventEmitter",
    "CommonEventEmitter is detected from non-instantiated class"
  );
  t.equals(
    getClassName(new CommonEventEmitter()),
    "CommonEventEmitter",
    "CommonEventEmitter is detected from class instance"
  );

  t.equals(
    getClassName(PhantomCore),
    "PhantomCore",
    "PhantomCore is detected from non-instantiated class"
  );
  t.equals(
    getClassName(new PhantomCore()),
    "PhantomCore",
    "PhantomCore is detected from class instance"
  );

  t.equals(
    getClassName(PhantomCollection),
    "PhantomCollection",
    "PhantomCollection is detected from non-instantiated class"
  );
  t.equals(
    getClassName(new PhantomCollection()),
    "PhantomCollection",
    "PhantomCollection is detected from class instance"
  );

  t.equals(
    getClassName(PhantomServiceManager),
    "PhantomServiceManager",
    "PhantomServiceManager is detected from non-instantiated class"
  );
  t.equals(
    getClassName(new PhantomServiceManager()),
    "PhantomServiceManager",
    "PhantomServiceManager is detected from class instance"
  );

  const serviceManager = new PhantomServiceManager();
  class TestService extends PhantomServiceCore {}
  serviceManager.startServiceClass(TestService);

  t.equals(
    getClassName(TestService),
    "TestService",
    "TestService is detected from non-instantiated class"
  );
  t.equals(
    getClassName(serviceManager.getServiceInstance(TestService)),
    "TestService",
    "TestService is detected from class instance"
  );

  t.end();
});

test("runtime environment", t => {
  t.plan(1);

  // IMPORTANT: The checked value is only used for test script and is not a
  // suitable replacement for the conditions within getIsNodeJS, itself
  t.equals(getIsNodeJS(), Boolean(typeof window === "undefined"));

  t.end();
});

test("super class", t => {
  t.plan(3);

  class ExtensionA extends PhantomCore {}

  t.equals(
    getSuperClass(ExtensionA),
    PhantomCore,
    "getSuperClass works for non-instantiated classes"
  );
  t.equals(
    getSuperClass(new ExtensionA()),
    PhantomCore,
    "getSuperClass works for instantiated classes"
  );

  t.notOk(getSuperClass(class ABC {}));

  t.end();
});

test("super parents", t => {
  t.plan(1);

  class ExtensionA extends PhantomCore {}
  class ExtensionB extends ExtensionA {}
  class ExtensionC extends ExtensionB {}
  class ExtensionD extends ExtensionC {}
  class ExtensionE extends ExtensionD {}

  t.deepEquals(getClassInheritance(ExtensionE), [
    ExtensionD,
    ExtensionC,
    ExtensionB,
    ExtensionA,
    PhantomCore,
    PhantomCoreUnwatched,
    _DestructibleEventEmitter,
    CommonEventEmitter,
    EventEmitter,
  ]);

  t.end();
});

test("class instance property names", t => {
  t.plan(3);

  const phantom = new PhantomCore();

  const fakeThing = function () {};

  t.throws(
    () => getClassInstancePropertyNames(fakeThing),
    "throws TypeError if using function"
  );

  const propNames = getClassInstancePropertyNames(phantom);

  t.ok(
    propNames.every(propName => typeof propName === "string"),
    "every property name is a string"
  );

  t.equals(
    propNames.length,
    [...new Set(propNames)].length,
    "every property name is unique"
  );

  t.end();
});

test("sleep", async t => {
  t.plan(2);

  // NOTE: Intentionally testing w/ 100 ms "grace buffer" to prevent this test
  // from sometimes erroring out due to time precision differences in
  // performance.now (used for measuring) and setTimeout (used internally in
  // sleep).
  //
  // The main purpose of this test is not for precision, but to ensure that
  // the time attribute actually affects sleep time.
  const graceBuffer = 100;

  await (async () => {
    const beforeStart = performance.now();
    await sleep();
    const afterEnd = performance.now();
    t.ok(
      afterEnd - beforeStart >= 1000 - graceBuffer,
      "sleep() defaults to 1000 ms"
    );
  })();

  await (async () => {
    const beforeStart = performance.now();
    await sleep(1500);
    const afterEnd = performance.now();
    t.ok(
      afterEnd - beforeStart >= 1500 - graceBuffer,
      "sleep() responds to argument for milliseconds"
    );
  })();

  t.end();
});

test("enum to numeric indexed object", t => {
  t.plan(1);

  t.deepEquals(enumToNumericIndexedObject(LogLevel), {
    0: "Silent",
    1: "Error",
    2: "Warn",
    3: "Info",
    4: "Debug",
    5: "Trace",
  });

  t.end();
});
