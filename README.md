[![MIT License][license-image]][license-url]
[![ci][ci-image]][ci-url]
[![CodeQL][codeql-image]][codeql-url]

[license-image]: https://img.shields.io/github/license/zenosmosis/phantom-core
[license-url]: https://raw.githubusercontent.com/zenOSmosis/phantom-core/main/LICENSE
[ci-image]: https://github.com/zenosmosis/phantom-core/actions/workflows/ci.yml/badge.svg
[ci-url]: https://github.com/zenOSmosis/phantom-core/actions/workflows/ci.yml
[codeql-image]: https://github.com/zenosmosis/phantom-core/workflows/CodeQL/badge.svg
[codeql-url]: https://github.com/zenOSmosis/phantom-core/actions/workflows/codeql-analysis.yml

# Phantom Core

<img src="phantom.svg" alt="Phantom" width="200"/>

Base package utilized in [Speaker App](https://speaker.app) / [https://github.com/zenOSmosis/speaker.app](https://github.com/zenOSmosis/speaker.app) which most other classes derive from.

## Characteristics

  - Can be run in Node.js and in browser
  - EventEmitter based core
  - Not a singleton on its own (can be extended w/ singleton support)
  - Destruct method: Unbinds event listeners and nullifies internal method calls
  - Event proxies: Events (i.e. on / once) can be mapped to other PhantomCore instances and are automatically unbound once the proxying host is destructed
  - Event constants: Internal events are exposed as module exports (i.e. EVT_UPDATED, EVT_DESTROYED)
  - Instance lookup by UUID / Symbol: If the UUID or Symbol is known for a given PhantomCore instance, that instance can be returned by the lookup function (i.e. PhantomCore.getInstanceWithUUID() or PhantomCore.getInstanceWithSymbol() static methods)
  - Logger, inspired by [loglevel](https://www.npmjs.com/package/loglevel), with log level support, and exposes original stack trace to console (node and browser)
  - Slightly opinionated deep object merging (based on [deepmerge](https://www.npmjs.com/package/deepmerge)))
  - PhantomCollection
    - Maintains a collection of arbitrary PhantomCore (and derived) instances
    - Can broadcast events to all of its children
    - Can re-emit events sent from one child out the collection itself (via included ChildEventBridge object)
    - Can add and remove child instances during runtime (i.e. "group size varies")
    - Can contain children bound to other PhantomCollections (share children across collections)
    - Can contain other collections as children (linked collections)
    - Accepts an optional key when adding a child to make it easier to extend with coerced types; the relevant child can be looked up by this key
    - Can optionally destruct all associated children

## Changelog

### Version 1.0.0 (Sept. 10, 2021)
  - Base PhantomCore, PhantomCollection and Logger support

### Version 1.0.1 (Sept. 25, 2021)
  - Fix issue where calling Logger.log method directly would lose stack trace

### Version 2.0.0 (TBD)

  - Enhanced precautions against memory leaks
  - Add global setImmediate regardless of context.  To use in a browser, require PhantomCore somewhere in the program before calling setImmediate.
  - Add version reporting as static method: PhantomCore.getPhantomCoreVersion()
  - Deprecate optional isReady parameter; using isAsync instead
  - Base PhantomCore off of DestructibleEventEmitter
  - Implement default auto-bind support to PhantomCore classes and derivatives (can be disabled by setting hasAutomaticBindings to false in constructor options)
  - Implement PhantomServiceCore and PhantomServiceManager servicing
  - Remove deep-merging of PhantomCore options and promote to a separate utility (deepMerge lives on its own)
  - Add registerShutdownHandler (and included function stack support)

TODO: Build out this documentation
