import packageJson from "../../package.json";
import { RecursiveObject } from "../types";

/**
 * Retrieves the package JSON data for PhantomCore.
 */
export default function getPackageJSON(): RecursiveObject {
  return packageJson;
}
