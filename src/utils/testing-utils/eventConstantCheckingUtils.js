const eventPrefix = "EVT_";

/**
 * Ensures that given object of event constants contains valid, individual
 * events in the formatting this project expects.
 *
 * If not valid, an error is raised, otherwise the return is void.
 *
 * @param {Object} events
 * @throws {ReferenceError | TypeError}
 * @return {void}
 */
function checkEvents(events) {
  const keys = Object.keys(events);
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
    if (typeof value !== "string") {
      throw new TypeError(`Value "${value}" is not a string`);
    }
  }

  const lenEvents = keys.length;
  const uniqueEvents = [...new Set(values)];
  const lenUniqueEvents = uniqueEvents.length;

  if (lenEvents !== lenUniqueEvents) {
    // FIXME: (jh) Add symbol support
    throw new ReferenceError("Events are not unique");
  }
}

/**
 * Retrieves a filtered object, based on the the given require object (i.e. via
 * require('phantom-core')) which contains events, and nothing else.
 *
 * @param {Object} es5Import
 * @return {Object}
 */
function extractEvents(es5Import) {
  const keys = Object.keys(es5Import).filter(predicate =>
    predicate.startsWith(eventPrefix)
  );

  const events = Object.fromEntries(keys.map(key => [key, es5Import[key]]));

  // Ensure the events are valid
  checkEvents(events);

  return events;
}

/**
 * Compares the given extension import against the base import in order to see
 * if the same events have been exported, with the exception of the exclusion
 * list.
 *
 * @param {Object} baseES5Import
 * @param {Object} extensionES5Import
 * @param {Object} baseES5ImportExclusions? [default = {}]
 */
function compareExportedEvents(
  baseES5Import,
  extensionES5Import,
  baseES5ImportExclusions = {}
) {
  const exportsA = extractEvents(baseES5Import);
  const exportsB = extractEvents(extensionES5Import);

  // Check that extensionES5Import contains same events as baseES5Import, minus any exceptions
  for (const [keyA, valueA] of Object.entries(exportsA)) {
    const valueB = exportsB[keyA];

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

module.exports = {
  checkEvents,
  extractEvents,
  compareExportedEvents,
};
