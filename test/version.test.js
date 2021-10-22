const test = require("tape");
const PhantomCore = require("../src");
const { getIsNodeJS } = PhantomCore;

test("version test", t => {
  t.plan(1);

  if (getIsNodeJS()) {
    // NOTE: This require falls outside of the main /src directory and is
    // utilized by Node.js itself
    const packageInfo = require("../node-utils/packageInfo");

    t.ok(PhantomCore.getPhantomCoreVersion() === packageInfo.version);
  } else {
    // Since we're not able to directly look at the filesystem in the browser
    // version, we'll just check to see if getIsNodeJS is working as expected
    // here (this test is a bit more simplistic than the original determiner
    // but should work well enough for testing purposes)
    t.ok((getIsNodeJS() === window) !== undefined);
  }

  t.end();
});
