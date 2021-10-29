const test = require("tape");
const EventEmitter = require("events");
const PhantomCore = require("../src");
const {
  PhantomCollection,
  PhantomServiceCore,
  PhantomServiceManager,
  getUnixTime,
  getUptime,
  getClassName,
  getIsNodeJS /* symbolToUUID */,
} = PhantomCore;

test("time", async t => {
  t.plan(7);

  const timeStart = getUnixTime();

  // NOTE (jh): Discovered that NaN type is a number, so doing parseInt check
  t.equals(
    parseInt(timeStart, 10),
    timeStart,
    "getUnixTime() returns a number"
  );

  const uptimeStart = getUptime();

  t.equals(
    parseInt(uptimeStart, 10),
    uptimeStart,
    "getUptime() returns a number"
  );

  await new Promise(resolve => setTimeout(resolve, 1000));

  t.ok(getUnixTime() > timeStart, "unixTime increments as expected");
  t.ok(getUptime() > uptimeStart, "uptime increments as expected");

  const phantom = new PhantomCore();

  // Due to previous awaits, phantom instance uptime shouldn't equal current (non-phantom) getUptime()
  t.notEquals(
    phantom.getInstanceUptime(),
    getUptime(),
    "phantom instance uptime does not equal getUptime after greater than one second await"
  );

  t.equals(
    phantom.getInstanceUptime(),
    0,
    "new phantom instance uptime starts at 0"
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
    getClassName(EventEmitter),
    "EventEmitter",
    "EventEmitter is detected from non-instantiated class"
  );
  t.equals(
    getClassName(new EventEmitter()),
    "EventEmitter",
    "EventEmitter is detected from class instance"
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

/*
test("symbol to UUID", t => {
  t.plan(16);

  const symbol1 = Symbol("abc");

  const symbol2 = Symbol("abc");

  const symbol3 = symbol1;

  const symbol4 = symbol2;

  t.equals(
    symbolToUUID(symbol1).length,
    36,
    "symbolToUUID(symbol1) returns string of 36 characters"
  );

  t.equals(
    symbolToUUID(symbol2).length,
    36,
    "symbolToUUID(symbol2) returns string of 36 characters"
  );

  t.equals(
    symbolToUUID(symbol1),
    symbolToUUID(symbol1),
    "symbolToUUID(symbol1) matches itself when called twice"
  );

  t.notEquals(symbol1, symbol2, "symbol1 and symbol2 are not equal");
  t.notEquals(
    symbolToUUID(symbol1),
    symbolToUUID(symbol2),
    "symbolToUUID(symbol1) and symbolToUUID(symbol2) are not equal"
  );

  t.equals(symbol1, symbol3, "symbol1 and symbol3 are equal");
  t.equals(
    symbolToUUID(symbol1),
    symbolToUUID(symbol3),
    "symbolToUUID(symbol1) and symbolToUUID(symbol3) are equal"
  );

  t.equals(symbol2, symbol4, "symbol2 and symbol4 are equals");
  t.equals(
    symbolToUUID(symbol2),
    symbolToUUID(symbol4),
    "symbolToUUID(symbol2) and symbolToUUID(symbol4) are equal"
  );

  t.notEquals(symbol2, symbol3, "symbol2 and symbol3 are not equal");
  t.notEquals(
    symbolToUUID(symbol2),
    symbolToUUID(symbol3),
    "symbolToUUID(symbol2) and symbolToUUID(symbol3) are not equal"
  );

  t.notEquals(symbol3, symbol4, "symbol3 and symbol4 are not equal");
  t.notEquals(
    symbolToUUID(symbol3),
    symbolToUUID(symbol4),
    "symbolToUUID(symbol3) and symbolToUUID(symbol4) are not equal"
  );

  t.notEquals(symbol1, symbol4, "symbol1 and symbol4 are not equal");
  t.notEquals(
    symbolToUUID(symbol1),
    symbolToUUID(symbol4),
    "symbolToUUID(symbol1) and symbolToUUID(symbol4) are not equal"
  );

  t.throws(
    () => {
      symbolToUUID({ foo: "test" });
    },
    TypeError,
    "does not accept non-symbol types"
  );

  t.end();
});
*/
