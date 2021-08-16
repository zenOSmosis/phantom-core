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

Base package utilized in [Speaker App](https://speaker.app) / [https://github.com/zenOSmosis/speaker.app](https://github.com/zenOSmosis/speaker.app).

Characteristics:

  - Can be run in Node.js and in browser
  - EventEmitter based core
  - Destruct method: Unbinds event listeners and nullifies internal method calls
  - Event proxies: Events (i.e. on / once) can be mapped to other PhantomCore instances and are automatically unbound once the proxying host is destructed
  - Event constants: Internal events are exposed as module exports (i.e. EVT_UPDATED, EVT_DESTROYED)
  - Instance lookup by UUID / Symbol: If the UUID or Symbol is known for a given PhantomCore instance, that instance can be returned by the lookup function (i.e. PhantomCore.getInstanceWithUUID() or PhantomCore.getInstanceWithSymbol() static methods)
  - Logger, inspired by [loglevel](https://www.npmjs.com/package/loglevel), with log level support, and exposes original stack trace to console (node and browser)
  - PhantomCollection
    - Maintains a collection of PhantomCore instances
    - Can broadcast events to all of its children
    - Can re-emit events sent from one child (via included ChildEventBridge object)
    - Can add and remove child instances (i.e. "group size varies") during runtime
    - Can contain children bound to other PhantomCollections (share children across collections)

TODO: Build out this documentation