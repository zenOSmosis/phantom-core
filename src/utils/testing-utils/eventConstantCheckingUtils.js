const eventPrefix = "EVT_";

// TODO: Build out

/**
 * TODO: Finish documenting
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
    throw new ReferenceError("Events are not unique");
  }
}

// TODO: Document and rename
function extractEvents(es5Import) {
  const keys = Object.keys(es5Import).filter(predicate =>
    predicate.startsWith(eventPrefix)
  );

  return Object.fromEntries(keys.map(key => [key, es5Import[key]]));
}

// TODO: Document and rename
function compareExportedEvents(
  baseImport,
  extensionImport,
  baseImportExclusions = {}
) {
  const exportsA = extractEvents(baseImport);
  const exportsB = extractEvents(extensionImport);

  // Check that extensionImport contains same events as baseImport, minus any exceptions
  for (const [keyA, valueA] of Object.entries(exportsA)) {
    const valueB = exportsB[keyA];

    // Ensure that exportB contains same object and value, with exception of exclusions
    if (valueB !== valueA) {
      // Ignore exclusion, if exists
      if (valueB === undefined && baseImportExclusions[keyA]) {
        continue;
      }

      throw new ReferenceError(
        `Extension has mismatched event value for constant "${keyA}"`
      );
    }
  }

  checkEvents(exportsA);
  checkEvents(exportsB);
}

module.exports = {
  checkEvents,
  extractEvents,
  compareExportedEvents,
};
