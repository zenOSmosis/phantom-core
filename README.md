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

Includes:

  - EventEmitter based core
  - Event proxies to other PhantomCore instances w/ automated unregistration once self or remote is destructed
  - Event constants
  - Instance lookup by UUID / Symbol
  - Logger w/ log levels which exposes original stack trace to console (node and browser)
  - UUID and short UUID per instance
  - Instance counting
  - Destruct method

TODO: Build out this documentation