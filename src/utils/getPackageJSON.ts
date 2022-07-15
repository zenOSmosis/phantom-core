import { RecursiveObject } from "../types";

// Package.json is required instead of imported due to resolveJsonModule
// prepending /src in dist directory
// @see https://stackoverflow.com/a/58941798
const packageJSON = require("../../package.json");

/**
 * Retrieves the package JSON data for PhantomCore.
 */
export default function getPackageJSON(): RecursiveObject {
  return packageJSON;
}
