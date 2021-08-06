const test = require("tape-async");
const { getUnixTime, getUptime } = require("../src");

test("time", async t => {
  t.plan(4);

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

  t.end();
});
