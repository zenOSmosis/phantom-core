[license-image]: https://img.shields.io/github/license/zenosmosis/phantom-core
[license-url]: https://raw.githubusercontent.com/zenOSmosis/phantom-core/main/LICENSE
[version-image]: https://img.shields.io/github/package-json/v/zenosmosis/phantom-core
[version-url]: https://github.com/zenOSmosis/phantom-core/blob/main/package.json#L3
[ci-image]: https://github.com/zenosmosis/phantom-core/actions/workflows/ci.yml/badge.svg
[ci-url]: https://github.com/zenOSmosis/phantom-core/actions/workflows/ci.yml
[codeql-image]: https://github.com/zenosmosis/phantom-core/workflows/CodeQL/badge.svg
[codeql-url]: https://github.com/zenOSmosis/phantom-core/actions/workflows/codeql-analysis.yml
[snyk-image]: https://snyk.io/test/github/zenosmosis/phantom-core/badge.svg
[snyk-url]: https://snyk.io/test/github/zenosmosis/phantom-core
[codefactor-image]: https://www.codefactor.io/repository/github/zenOSmosis/phantom-core/badge
[codefactor-url]: https://www.codefactor.io/repository/github/zenOSmosis/phantom-core
[phantom-core-architecture-image]: https://img.shields.io/badge/architecture-phantom--core-red
[phantom-core-architecture-url]: https://github.com/zenosmosis/phantom-core
[style-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat
[style-url]: https://prettier.io/
[typescript-image]: https://shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=FFF&style=flat
[typescript-url]: https://www.typescriptlang.org/

[![MIT License][license-image]][license-url]
[![version][version-image]][version-url]
[![ci][ci-image]][ci-url]
[![CodeQL][codeql-image]][codeql-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![CodeFactor][codefactor-image]][codefactor-url]
[![phantom-core-architecture][phantom-core-architecture-image]][phantom-core-architecture-url]
[![Style Status][style-image]][style-url]
[![TypeScript][typescript-image]][typescript-url]

# PhantomCore

<center>
<img src="phantom.svg" alt="Phantom" width="200"/>
</center>

_**This is a work in progress, subject to many API updates and feature regressions in a short amount of time, as it is used for the development and prototyping of several applications at once.**_

PhantomCore is an EventEmitter-based, object-oriented application architecture for browsers and Node.js, featuring lifecycle management, exported common event constants, and some basic utilities which build on top of these principles and form some basic building blocks.

Within the context of another application, it can be integrated as lightly as only having a single class using PhantomCore, or the entire application is built on top of PhantomCore.

It is the common base package utilized in [Speaker App](https://speaker.app) / [ReShell](https://reshell.org) which most other classes derive from, independent of their React view layers.

## Characteristics

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
  - Can re-emit events sent from one child out of the collection itself (via included ChildEventBridge object)
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

## Basic Example

```js
import PhantomCore, { EVT_READY, EVT_DESTROY } from "phantom-core";

class MyExtension extends PhantomCore {
  constructor() {
    super();

    // Cleanup handlers are invoked in LIFO order by default, so that cleanup handlers can be placed consecutively after certain operations

    this._a = new PhantomCore();
    this.registerCleanupHandler(async () => {
      this.log("Finish the stack cleanup...");

      // Referenced PhantomCore instances must be destructed or disassociated, otherwise a warning will be raised about a potential memory leak
      await this._a.destroy();
    });

    this._b = { echo: 123 };
    this.registerCleanupHandler(() => {
      // Each PhantomCore instance has its own logger
      this.log(
        "Last defined gets cleaned up first, to more easily unwrap the stack on cleanup"
      );

      this._b = null;
    });

    // Asynchronous methods in registerCleanupHandler are awaited upon before
    // the next item's invocation to eliminate race conditions
  }
}

// Example implementation
(async () => {
  const ext = new MyExtension();

  ext.once(EVT_READY, () => {
    ext.log("Ready...");

    // For demonstration
    ext.destroy();
  });

  ext.once(EVT_DESTROY, () => {
    ext.log("Extension destroyed");
  });

  // Log output:
  //
  // [2022-06-14T01:46:52+00:00 info MyExtension 655eba48-892a-4d4d-8f45-a4ab20204679] Ready...
  // [2022-06-14T01:46:52+00:00 info MyExtension 655eba48-892a-4d4d-8f45-a4ab20204679] Extension destroyed
  // [2022-06-14T01:46:52+00:00 info MyExtension 655eba48-892a-4d4d-8f45-a4ab20204679] Do some cleanup work here...
  // [2022-06-14T01:46:52+00:00 info MyExtension 655eba48-892a-4d4d-8f45-a4ab20204679] And some additional cleanup work here...
})();
```

## Documentation

PhantomCore's TypeScript API documentation is available online at: https://docs.phantom-core.zenosmosis.com/ (generated with [TypeDoc](https://typedoc.org/): A documentation generator for TypeScript projects)

## Additional Information

Any reasonable attempt to try to explain this thing will surely develop over time, and such conclusions theoretically will eventually work their way back into the README.

Example API usage and other documentation will follow.

TODO: Include sections for testing [SauceLabs / airtap], development, etc.)
