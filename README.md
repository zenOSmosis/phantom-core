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

# PhantomCore

<img src="phantom.svg" alt="Phantom" width="200"/>

Common base package utilized in [Speaker App](https://speaker.app) / [ReShell](https://reshell.org) which most other classes derive from.

PhantomCore provides a common architecture between browsers and Node.js and does not expose any DOM-related functionality directly.

## Characteristics

  - Can be run in Node.js and in browser (as a base for extension classes to build upon).
  - EventEmitter based core with exported event constants (i.e. EVT_UPDATED, EVT_DESTROYED)
  - Logger, inspired by [loglevel](https://www.npmjs.com/package/loglevel), with log level support, and exposes original stack trace to console (node and browser)
  - Not a singleton on its own (can be extended w/ singleton support)
  - Destruct method: Unbinds event listeners and nullifies internal method calls
  - Event proxies: Events (i.e. on / once) can be mapped to other PhantomCore instances and are automatically unbound once the proxying host is destructed
  - Instance lookup by UUID / Symbol: If the UUID or Symbol is known for a given PhantomCore instance, that instance can be returned by the lookup function (i.e. PhantomCore.getInstanceWithUUID() or PhantomCore.getInstanceWithSymbol() static methods)
  - Slightly opinionated deep object merging (based on [deepmerge](https://www.npmjs.com/package/deepmerge))
  - PhantomCollection:
    - Maintains a collection of arbitrary PhantomCore (and derived) instances
    - Can broadcast events to all of its children
    - Can re-emit events sent from one child out the collection itself (via included ChildEventBridge object)
    - Can add and remove child instances during runtime (i.e. "group size varies")
    - Can contain children bound to other PhantomCollections (share children across collections)
    - Can contain other collections as children (linked collections)
    - Accepts an optional key when adding a child to make it easier to extend with coerced types; the relevant child can be looked up by this key
    - Can optionally destruct all associated children
  - PhantomState / PhantomSerializableState: Simple, object-based state stores with a shallow-merging update strategy
  - PhantomServiceCore / PhantomServiceManager:
    - Wraps PhantomState and PhantomCollection with the ability to instantiate and manage services
    - PhantomServiceCore instances act as singletons within a PhantomServiceManager context, instead of a global context
    - Currently being prototyped for usage with [ReShell](https://reshell.org) desktop prototype

## Changelog

### Version 2.4.0 (Feb. 3, 2022)

  - Improve PhantomCore instance (and extension) shutdown phase coordination:
    - Add EVT_BEFORE_DESTROY event and PhantomCore#getIsDestroying() lifecycle method
    - Add destroyHandler argument to PhantomCore#destroy() (and extension) classes
  - PhantomCore#registerShutdownHandler callback methods no longer will ignore exceptions.  If an exception is thrown, the underlying instance will not be treated as fully discarded (this may change in the future).
  - Add optional isMerge argument to PhantomState#setState() and PhantomSerializableState#setState(), which defaults to true.  If setting to false, the new state completely overrides the previous state.

### Version 2.3.3 (Jan. 23, 2022)

  - Fix issue where PhantomCore superclass could potentially run destroy handler more than once if called multiple times

### Version 2.3.2 (Jan. 28, 2022)

  - Fix issue where events emit from PhantomCore#registerShutdownHandler would not emit through PhantomCore

### Version 2.3.1 (Jan. 19, 2022)

  - Fix issue where bound service collections from another phantom-core version would trigger "not a collection" errors

### Version 2.3.0 (Jan. 14, 2022)

  - Add sleep utility

### Version 2.2.2 (Jan. 4, 2022)

  - Fix issue where, under some circumstances, destructed children could appear in PhantomCollection#getChildren() results

### Version 2.2.1 (Dec. 16, 2021)

  - Relax same PhantomCore version requirements for PhantomCore#proxyOnce and PhantomCore#proxyOff methods.  These should have been included in v2.1.3.

### Version 2.2.0 (Dec. 16, 2021)

  - Add ArbitraryPhantomWrapper, an extension to PhantomCore which wraps an arbitrary object, enabling it to adapt the PhantomCore event lifecycle

### Version 2.1.3 (Dec. 15, 2021)

  - Relax same PhantomCore version requirements for event proxying

### Version 2.1.2 (Dec. 13, 2021)

  - Relax same PhantomCore version requirements for PhantomCollection child instances

### Version 2.1.1 (Dec. 13, 2021)

  - Return collection class instance when running bindCollectionClass on a service

### Version 2.0.1 (Nov. 13, 2021)

  - Fix incorrect version reported by PhantomCore.getPhantomCoreVersion() static method

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
  - Implement PhantomState & PhantomSerializableState

### Version 1.0.1 (Sept. 25, 2021)
  - Fix issue where calling Logger.log method directly would lose stack trace

### Version 1.0.0 (Sept. 10, 2021)
  - Base PhantomCore, PhantomCollection and Logger support

TODO: Build out this documentation (include sections for testing [SauceLabs / airtap], development, etc.)
