const test = require("tape-async");
const PhantomCore = require("../src");
const packageInfo = require("../utils/packageInfo");

test("version test", async t => {
  t.ok(PhantomCore.getVersion() === packageInfo.version);

  t.end();
});
