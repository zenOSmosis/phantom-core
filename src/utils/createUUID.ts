import { v4 as uuidv4 } from "uuid";

/**
 * Generates a 36-character unique identifier, conforming to RFC4122 (a UUID
 * URN Namespace) designed to be unique across space and time, which
 * represents this class instance.
 *
 * @see https://www.ietf.org/rfc/rfc4122.txt
 */
export default function createUUID() {
  return uuidv4();
}
