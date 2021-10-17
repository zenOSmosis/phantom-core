const { readFileSync } = require("fs");
const path = require("path");

const packageInfo = JSON.parse(
  readFileSync(path.resolve(__dirname, "..", "package.json")).toString()
);

module.exports = packageInfo;
