[![MIT License][license-image]][license-url]
[![ci][ci-image]][ci-url]
[![CodeQL][codeql-image]][codeql-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![CodeFactor][codefactor-image]][codefactor-url]

[license-image]: https://img.shields.io/github/license/zenosmosis/phantom-core
[license-url]: https://raw.githubusercontent.com/zenOSmosis/phantom-core/main/LICENSE
[ci-image]: https://github.com/zenosmosis/phantom-core/actions/workflows/ci.yml/badge.svg
[ci-url]: https://github.com/zenOSmosis/phantom-core/actions/workflows/ci.yml
[codeql-image]: https://github.com/zenosmosis/phantom-core/workflows/CodeQL/badge.svg
[codeql-url]: https://github.com/zenOSmosis/phantom-core/actions/workflows/codeql-analysis.yml
[snyk-image]: https://snyk.io/test/github/zenosmosis/phantom-core/badge.svg
[snyk-url]: https://snyk.io/test/github/zenosmosis/phantom-core
[codefactor-image]: https://www.codefactor.io/repository/github/zenOSmosis/phantom-core/badge
[codefactor-url]: https://www.codefactor.io/repository/github/zenOSmosis/phantom-core

# Phantom Core

<img src="phantom.svg" alt="Phantom" width="200"/>

Common base package utilized in [Speaker App](https://speaker.app) / [ReShell](https://reshell.org) which most other classes derive from.

Phantom Core provides a common architecture between browsers and Node.js and does not expose any DOM-related functionality directly.

## Characteristics

  - Can be run in Node.js and in browser (as a base for extension classes to build upon).
  - EventEmitter based core with exported event constants (i.e. EVT_UPDATED, EVT_DESTROYED)
  - Logger, inspired by [loglevel](https://www.npmjs.com/package/loglevel), with log level support, and exposes original stack trace to console (node and browser)
  - Not a singleton on its own (can be extended w/ singleton support)
  - Destruct method: Unbinds event listeners and nullifies internal method calls
  - Event proxies: Events (i.e. on / once) can be mapped to other PhantomCore instances and are automatically unbound once the proxying host is destructed
  - Instance lookup by UUID / Symbol: If the UUID or Symbol is known for a given PhantomCore instance, that instance can be returned by the lookup function (i.e. PhantomCore.getInstanceWithUUID() or PhantomCore.getInstanceWithSymbol() static methods)
  - Slightly opinionated deep object merging (based on [deepmerge](https://www.npmjs.com/package/deepmerge)))
  - PhantomCollection:
    - Maintains a collection of arbitrary PhantomCore (and derived) instances
    - Can broadcast events to all of its children
    - Can re-emit events sent from one child out the collection itself (via included ChildEventBridge object)
    - Can add and remove child instances during runtime (i.e. "group size varies")
    - Can contain children bound to other PhantomCollections (share children across collections)
    - Can contain other collections as children (linked collections)
    - Accepts an optional key when adding a child to make it easier to extend with coerced types; the relevant child can be looked up by this key
    - Can optionally destruct all associated children
  - PhantomState / PhantomSerializedState: Simple, object-based state stores with a shallow-merging update strategy
  - PhantomServiceCore / PhantomServiceManager:
    - Wraps PhantomState and PhantomCollection with the ability to instantiate and manage services
    - PhantomServiceCore instances act as singletons within a PhantomServiceManager context, instead of a global context
    - Currently being protoyped for usage with [ReShell](https://reshell.org) desktop prototype

## Changelog

### Version 1.0.0 (Sept. 10, 2021)
  - Base PhantomCore, PhantomCollection and Logger support

### Version 1.0.1 (Sept. 25, 2021)
  - Fix issue where calling Logger.log method directly would lose stack trace

### Version 2.0.0 (Nov. 6, 2021)

  - Enhanced precautions against memory leaks
  - Add global setImmediate regardless of context.  To use in a browser, require PhantomCore somewhere in the program before calling setImmediate.
  - Add version reporting as static method: PhantomCore.getPhantomCoreVersion()
  - Deprecate optional isReady parameter; using isAsync instead
  - Base PhantomCore off of DestructibleEventEmitter
  - Implement default auto-bind support to PhantomCore classes and derivatives (can be disabled by setting hasAutomaticBindings to false in constructor options)
  - Implement PhantomServiceCore and PhantomServiceManager servicing
  - Remove deep-merging of PhantomCore options and promote to a separate utility (deepMerge lives on its own)
  - Implement FunctionStack, which manages an arbitrary stack of functions
  - Implement registerShutdownHandler (via FunctionStack), which manages a stack functions to be run when a PhantomCore instance is destructing
  - Implement PhantomCollection iterator (i.e. [...collection] retrieves all collection children). NOTE: After a collection is destructed, it can no longer be iterated, and attempts to do so throw a TypeError. This functionality may change in the future.
  - Implement PhantomState & PhantomSerializedState

TODO: Build out this documentation
