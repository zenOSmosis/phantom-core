[![MIT License][license-image]][license-url]
[![ci][ci-image]][ci-url]
[![CodeQL][codeql-image]][codeql-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![CodeFactor][codefactor-image]][codefactor-url]
[![Style Status][style-image]][style-url]

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
[style-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[style-url]: https://prettier.io/

# PhantomCore

<img src="phantom.svg" alt="Phantom" width="200"/>

**This is a work in progress, subject to many API updates and feature regressions in a short amount of time, as it is used for development and prototyping of several applications at once.**

PhantomCore is an EventEmitter-based, object-oriented application architecture for browsers and Node.js, featuring lifecycle management, exported common event constants, and some basic utilities which build on top of these principles which form some basic building blocks.

Within the context of another application, it can be integrated as lightly as only having a single class using PhantomCore, or the entire application being built on top of PhantomCore.

It is the common base package utilized in [Speaker App](https://speaker.app) / [ReShell](https://reshell.org) which most other classes derive from, independent of their React view layers.

## Characteristics

TODO: Move the following into individual content sections

- Can be run in Node.js and in browser (as a base for extension classes to build upon)
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

### PhantomCore

-- TODO: Document

### PhantomCollection

Phantom Collection is an iterable collection of PhantomCore instances. Typically these are extensions of PhantomCore with a common purpose.

### PhantomService

Phantom Services **_do_** things. i.e. A Phantom service may bind to a WebSocket connection, translating network activity into actionable events. When utilized in a frontend package such as [ReShell](https://github.com/zenOSmosis/reshell), updates to the service will update any window which is attached to the service.

#### PhantomServiceCore

PhantomServiceCore is a base class which user-defined services should extend.

#### PhantomServiceManager

PhantomServiceManager contains a [collection](#phantomcollection) of PhantomServiceCore instances. Typically, one PhantomServiceManager is all that is needed per environment, however it is designed to run concurrent manager's if necessary.

## Additional Information

Any reasonable attempt to try to explain this thing will surely develop over time, and such conclusions theoretically will eventually work their way back into the README.

Example API usage and other documentation will follow.

TODO: Include sections for testing [SauceLabs / airtap], development, etc.)

## Changelog

### Version 2.7.1 (Feb. 27, 2022)

- Fix issue where getIsNodeJS would return true with create-react-app
- Fix issue where Webpack would always throw "Module not found: Can't resolve 'perf_hooks'" when evaluating the performance module

### Version 2.7.0 (Feb. 24, 2022)

- Implement stable references for subsequent calls to PhantomCollection getChildren(), provided that the number of children are not changed between calls. This fixes an issue when using the children result set in React components causing hooks to re-run if the children were used as a dependency.
- PhantomCollection getChildMetaDescription() method removed (breaking change, version 2.7 of PhantomCore PhantomCollection cannot be used in conjunction with previous versions of PhantomCore due to "loose instance" checks failing as previous versions will look for this method)
- Remove PhantomCollection \_lenChildren protected property (no longer necessary)
- PhantomCollection changed to still be iterable after destruct (shouldn't contain any children; getChildren() added as PhantomCore keep-alive method)
- Improve CPU efficiency of getUnixTime() utility by capturing initial UTC time, and using a performance.now() offset for subsequent time capturing
- Add consume() utility function to consume JavaScript variables so they don't get flagged for not being utilized (special-case scenarios)

### Version 2.6.1 (Feb. 20, 2022)

- Rename PhantomState / PhantomSerializableState setState partialNextState argument to match JSDoc (no public API change)

### Version 2.6.0 (Feb. 10, 2022)

- Remove registerShutdownHandler and replace with registerCleanupHandler. Specifically, registerCleanupHandler has these characteristics:
  - LIFO (last in, first out) ordering, running the operations in reverse order in which they were defined. This allows cleanup handlers to be specified right after their properties have been defined, and any subsequent properties and their own cleanup handlers which depend on previously defined properties will destruct prior to their dependencies.
  - The stack is invoked after EVT_DESTROYED is emit (after all event listeners have been removed)
- Implement reference-counting cleanup of EVT_DESTROYED listeners for event proxy targets. This listener is used to tell the event proxy host to remove its own registrations for events the now destructed target instance is no longer handling.

### Version 2.5.1 (Feb. 6, 2022)

- PhantomCore proxy event binding fixes:
  - Fix issue where proxy binding stacks up EVT_DESTROYED listeners on proxy instance
  - Rename proxyInstance arguments to targetInstance for clarification (no public API changes)

### Version 2.5.0 (Feb. 5, 2022)

- Remove destroyHandlerStack; warn if subsequent calls to destroy() are invoked before fully destructing; throw error if subsequent calls to destroy() are invoked after fully destructing

### Version 2.4.1 (Feb. 5, 2022)

- PhantomCollection: Don't include children which are in destructing phase in getChildren(). Previous version only included destructed instances.
- Fix issue where shutdown handler could error if rapidly invoked

### Version 2.4.0 (Feb. 3, 2022)

- Improve PhantomCore instance (and extension) shutdown phase coordination:
  - Add EVT_BEFORE_DESTROY event and PhantomCore.getIsDestroying() lifecycle method
  - Add destroyHandler argument to PhantomCore.destroy() (and extension) classes
- PhantomCore.registerShutdownHandler callback methods no longer will ignore exceptions. If an exception is thrown, the underlying instance will not be treated as fully discarded (this may change in the future).
- Add optional isMerge argument to PhantomState#setState() and PhantomSerializableState#setState(), which defaults to true. If setting to false, the new state completely overrides the previous state.

### Version 2.3.3 (Jan. 23, 2022)

- Fix issue where PhantomCore superclass could potentially run destroy handler more than once if called multiple times

### Version 2.3.2 (Jan. 28, 2022)

- Fix issue where events emit from PhantomCore.registerShutdownHandler would not emit through PhantomCore

### Version 2.3.1 (Jan. 19, 2022)

- Fix issue where bound service collections from another phantom-core version would trigger "not a collection" errors

### Version 2.3.0 (Jan. 14, 2022)

- Add sleep utility

### Version 2.2.2 (Jan. 4, 2022)

- Fix issue where, under some circumstances, destructed children could appear in PhantomCollection#getChildren() results

### Version 2.2.1 (Dec. 16, 2021)

- Relax same PhantomCore version requirements for PhantomCore.proxyOnce and PhantomCore.proxyOff methods. These should have been included in v2.1.3.

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
- Add global setImmediate regardless of context. To use in a browser, require PhantomCore somewhere in the program before calling setImmediate.
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
