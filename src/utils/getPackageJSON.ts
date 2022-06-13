const packageJson = require("../../package.json");

/**
 * Retrieves the package JSON data for PhantomCore.
 */
export default function getPackageJSON(): {
  // TODO: [3.0.0] Make recursive type
  [key: string]:
    | string
    | number
    | boolean
    | { [key: string]: string | number | boolean };
} {
  return packageJson;
}
