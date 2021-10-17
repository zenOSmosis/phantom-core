const { writeFileSync } = require("fs");
const path = require("path");
const packageInfo = require("./packageInfo");

const { version } = packageInfo;

writeFileSync(
  path.resolve(__dirname, "..", "src", "static", "version.js"),
  `module.exports = "${version}"`
);
