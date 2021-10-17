const test = require("tape-async");
const PhantomCore = require("../src");
const packageInfo = require("../utils/packageInfo");

test("version test", async t => {
  t.ok(PhantomCore.getPhantomCoreVersion() === packageInfo.version);

  t.end();
});
