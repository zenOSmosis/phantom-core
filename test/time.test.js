const test = require("tape-async");
const PhantomCore = require("../src");
const { getUnixTime, getUptime } = require("../src");

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
