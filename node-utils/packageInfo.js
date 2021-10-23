// TODO: Check if we're running in Node.js before executing the following
const { readFileSync } = require("fs");
const path = require("path");

const packageInfo = JSON.parse(
  readFileSync(path.resolve(__dirname, "..", "package.json")).toString()
);

module.exports = packageInfo;
