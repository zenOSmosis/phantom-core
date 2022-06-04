// TODO: [3.0.0] Define PhantomCoreEvent type

import { RecursiveObject } from "../../types";
import { EventConstant, EventTypes } from "../../PhantomCore";
import getEnumValues from "../enum-utils/getEnumValues";

const eventPrefix = "EVT_";

/**
 * Ensures that given object of event constants contains valid, individual
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
    if (!getEnumValues(EventTypes).includes(typeof value)) {
      throw new TypeError(`Value "${String(value)}" is not a string`);
    }
  }

  const lenEvents = keys.length;
  const uniqueEvents = [...new Set(values)];
  const lenUniqueEvents = uniqueEvents.length;

  if (lenEvents !== lenUniqueEvents) {
    // FIXME: (jh) Add symbol support?
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
export function extractEvents(es5Import: RecursiveObject): {
  [key: EventConstant]: string;
} {
  const keys = Object.keys(es5Import).filter(pred =>
    pred.startsWith(eventPrefix)
  );

  validateKeysExist(keys);

  const events: RecursiveObject = Object.fromEntries(
    keys.map(key => [key, es5Import[key]])
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
  baseES5Import: RecursiveObject,
  inheritingES5Import: RecursiveObject,
  baseES5ImportExclusions: RecursiveObject = {}
): void {
  const exportsA = extractEvents(baseES5Import);
  const exportsB = extractEvents(inheritingES5Import);

  // Check that extensionES5Import contains same events as baseES5Import, minus any exceptions
  for (const [keyA, valueA] of Object.entries(exportsA)) {
    const valueB = (exportsB as { [key: string]: string })[keyA];

    // Ensure that exportB contains same object and value, with exception of exclusions
    if (valueB !== valueA) {
      // Ignore exclusion, if exists
      if (valueB === undefined && baseES5ImportExclusions[keyA]) {
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
