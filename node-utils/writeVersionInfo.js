const { writeFileSync } = require("fs");
const path = require("path");
const packageInfo = require("./packageInfo");

const { version } = packageInfo;

// Writes the version info to a static file which is included in PhantomCore
writeFileSync(
  path.resolve(__dirname, "..", "src", "static", "version.js"),
  `module.exports = "${version}";\n`
);
