const { writeFileSync } = require("fs");
const path = require("path");
const packageInfo = require("./packageInfo");

const { version } = packageInfo;

// TODO: Maybe this isn't needed afterall, just import directly from package.json
// @see https://github.com/microsoft/OCR-Form-Tools/blob/master/src/common/appInfo.ts

// Writes the version info to a static file which is included in PhantomCore
writeFileSync(
  path.resolve(__dirname, "..", "src", "static", "version.js"),
  `module.exports = "${version}";\n`
);
