import { RecursiveObject, Primitive } from "../../types";
import { EventConstant, EventTypes } from "../../PhantomCore";
import getEnumValues from "../enum-utils/getEnumValues";

const eventPrefix = "EVT_";

/**
 * Ensures the given value is a proper event value.
 *
 * @throws {TypeError}
 */
export function checkEventValue(event: Primitive | unknown): void {
  if (typeof event === "string") {
    if (!/^[a-z]+(-[a-z]+)*$/g.test(event)) {
      throw new TypeError("Event must be all lowercase letters and hyphens");
    }
  }

  const acceptableTypes = getEnumValues(EventTypes);

  if (!acceptableTypes.includes(typeof event)) {
    throw new TypeError(
      `Value "${String(event)}" is not an acceptable type (${acceptableTypes})`
    );
  }
}

/**
 * Ensures that the given object of event constants contains valid, individual
 * events in the formatting this project expects.
 *
 * If not valid, an error is raised, otherwise the return is void.
 *
 * @throws {ReferenceError | TypeError}
 */
export function checkEvents(events: RecursiveObject): void {
  const keys = Object.keys(events);

  validateKeysExist(keys);

  const values = Object.values(events);

  for (const key of keys) {
    if (key !== key.toUpperCase()) {
      throw new ReferenceError(`Event "${event}" is not upper-case`);
    }

    if (!key.startsWith(eventPrefix)) {
      throw new ReferenceError(
        `Event "${event}" does not start with "${eventPrefix}"`
      );
    }
  }

  for (const value of values) {
    checkEventValue(value);
  }

  const lenEvents = keys.length;
  const uniqueEvents = [...new Set(values)];
  const lenUniqueEvents = uniqueEvents.length;

  if (lenEvents !== lenUniqueEvents) {
    throw new ReferenceError("Events are not unique");
  }
}

/**
 * Extracts PhantomCore-based events from the given imports.
 *
 * Retrieves a filtered object, based on the the given exported values (i.e.
 * via import * as MyImportExports from 'x') which contains events, and nothing
 * else.
 *
 * @throws {ReferenceError}
 */
export function extractEvents(esImports: RecursiveObject): {
  [key: EventConstant]: string;
} {
  const keys = Object.keys(esImports).filter(pred =>
    pred.startsWith(eventPrefix)
  );

  validateKeysExist(keys);

  const events: RecursiveObject = Object.fromEntries(
    keys.map(key => [key, esImports[key]])
  );

  // Ensure the events are valid
  checkEvents(events);

  return events as { [key: EventConstant]: string };
}

/**
 * Compares the given extension import against the base import in order to see
 * if the same events have been exported, with the exception of the exclusion
 * list.
 *
 * @throws {ReferenceError}
 */
export function compareExportedEvents(
  esImports: RecursiveObject,
  inheritingESImports: RecursiveObject,
  esImportExclusions: RecursiveObject = {}
): void {
  const exportsA = extractEvents(esImports);
  const exportsB = extractEvents(inheritingESImports);

  // Check that extensionesImports contains same events as esImports, minus any exceptions
  for (const [keyA, valueA] of Object.entries(exportsA)) {
    const valueB = (exportsB as { [key: string]: string })[keyA];

    // Ensure that exportB contains same object and value, with exception of exclusions
    if (valueB !== valueA) {
      // Ignore exclusion, if exists
      if (valueB === undefined && esImportExclusions[keyA]) {
        continue;
      }

      throw new ReferenceError(
        `Extension has mismatched event value for constant "${keyA}"`
      );
    }
  }
}

/**
 * Validate keys are not empty.
 *
 * @throws {ReferenceError}
 */
function validateKeysExist(keys: string[]) {
  if (!keys.length) {
    throw new ReferenceError(
      "No keys have been found. Are you sure you are comparing all exported values?"
    );
  }
}
