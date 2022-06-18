import test from "tape";
import PhantomCore from "../src";

test("version test", t => {
  t.plan(1);

  const packageJson = require("../package.json");
  t.equals(
    PhantomCore.getPhantomCoreVersion(),
    packageJson.version,
    "version matches package.json version"
  );

  t.end();
});
