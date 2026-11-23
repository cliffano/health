<!-- BEGIN:AVATAR -->
![Avatar](avatar.jpg)
<!-- END:AVATAR -->

<!-- BEGIN:BADGES -->
[![Build Status](https://github.com/cliffano/health/workflows/CI/badge.svg)](https://github.com/cliffano/health/actions?query=workflow%3ACI)
[![Dependencies Status](https://img.shields.io/librariesio/release/npm/health)](https://libraries.io/npm/health)
[![Code Scanning Status](https://github.com/cliffano/health/workflows/CodeQL/badge.svg)](https://github.com/cliffano/health/actions?query=workflow%3ACodeQL)
[![Coverage Status](https://coveralls.io/repos/github/cliffano/health/badge.svg?branch=main)](https://coveralls.io/r/cliffano/health?branch=main)
[![Security Status](https://snyk.io/test/github/cliffano/health/badge.svg)](https://snyk.io/test/github/cliffano/health)
[![Published Version](https://img.shields.io/npm/v/health.svg)](https://www.npmjs.com/package/health)
<!-- END:BADGES -->

# Health

Health verifies networking protocol responses against YAML expectation files.

Describe what a healthy endpoint looks like (an HTTP status, a header, a JSON field, a DNS record, a TLS certificate expiry, an NTP clock offset) and Health checks the live response against it. Every protocol is built on Node.js core modules (`http`, `https`, `http2`, `net`, `tls`, `dgram`, `dns`, and the global `WebSocket`), so there are no protocol client dependencies.

## Installation

```bash
npm install -g health
```

Requires Node.js 22 or newer.

## Usage

The simplest expectation file, `google.yaml`:

```yaml
protocol: http
request:
  url: https://google.com
expect:
  status: 200
```

Check it from command-line:

```bash
health check google.yaml
```

Check multiple files, and display the full captured result of each check:

```bash
health check --verbose http.yaml dns.yaml tls.yaml
```

Without any file argument, `health check` uses `health.yaml` in the current directory. Create a sample one using:

```bash
health init
```

The exit code is `0` when every check passes and `1` otherwise, so it can be used directly as a CI step or a cron job. Show help guide:

```bash
health --help
```

From JavaScript:

```javascript
import Health from "health";

const health = new Health();

// check a single expectation
health.check(
  {
    name: "google",
    protocol: "http",
    request: { url: "https://google.com" },
    expect: { status: 200 },
  },
  function (err, result) {
    // result: { name, protocol, ok, failures: [{ path, message }], result }
  },
);

// check every expectation in a YAML file
health.checkFile("google.yaml", function (err, results) {});

// check multiple YAML files, an unreadable file is reported, not thrown
health.checkFiles(["http.yaml", "dns.yaml"], function (err, reports) {
  // reports: [{ file, error, results }]
});
```

A protocol failure such as a refused connection or a timeout is reported as a failed result with an `error` message, not as a callback error. The callback error is only used when a check can't be run at all, e.g. unknown protocol or invalid YAML.

## Expectation files

Each check has a `protocol`, a protocol-specific `request`, an `expect` block, and an optional `name`. A file can hold a single check, a top-level `checks` array, or multiple YAML documents separated by `---`:

```yaml
checks:
  - name: web up
    protocol: http
    request: { url: https://example.com }
    expect: { status: 200 }
  - name: dns ok
    protocol: dns
    request: { name: example.com }
    expect: { count: { $gte: 1 } }
```

See [examples](examples/) for a complete YAML file per protocol.

## Configuration reference

Every check, request, and expect property of each protocol, with its type, default, and an example:

* [HTTP and HTTPS](docs/conf-http.md)
* [HTTP/2](docs/conf-http2.md)
* [TCP](docs/conf-tcp.md)
* [UDP](docs/conf-udp.md)
* [DNS](docs/conf-dns.md)
* [TLS](docs/conf-tls.md)
* [WebSocket](docs/conf-websocket.md)
* [NTP](docs/conf-ntp.md)

## Protocols

| Protocol | Core module | Verifiable fields |
|----------|-------------|-------------------|
| [`http`, `https`](docs/conf-http.md) | `http`, `https` | `url`, `status`, `statusText`, `httpVersion`, `headers.*`, `body`, `bodyLength`, `json.*`, `redirects`, `responseTime`, `remoteAddress`, `tls.*` (`protocol`, `cipher`, `authorized`, `certSubject`, `certIssuer`, `certValidFrom`, `certValidTo`, `certDaysRemaining`) |
| [`http2`](docs/conf-http2.md) | `http2` | `url`, `status`, `httpVersion`, `alpnProtocol`, `headers.*`, `body`, `bodyLength`, `json.*`, `responseTime` |
| [`tcp`](docs/conf-tcp.md) | `net` | `connected`, `connectTime`, `responseTime`, `remoteAddress`, `remoteFamily`, `data`, `dataHex`, `bytesReceived` |
| [`udp`](docs/conf-udp.md) | `dgram` | `responded`, `responseTime`, `data`, `dataHex`, `bytesReceived`, `remoteAddress`, `remotePort` |
| [`dns`](docs/conf-dns.md) | `dns` | `name`, `rrtype`, `records`, `count`, `responseTime` |
| [`tls`](docs/conf-tls.md) | `tls` | `connected`, `authorized`, `authorizationError`, `protocol`, `cipher`, `cipherVersion`, `alpnProtocol`, `servername`, `responseTime`, `cert.*` (`subject`, `issuer`, `subjectAltName`, `validFrom`, `validTo`, `daysRemaining`, `serialNumber`, `fingerprint256`) |
| [`websocket`, `ws`](docs/conf-websocket.md) | global `WebSocket` | `connected`, `connectTime`, `protocol`, `extensions`, `messageReceived`, `message`, `responseTime` |
| [`ntp`](docs/conf-ntp.md) | `dgram` | `responded`, `valid`, `leapIndicator`, `version`, `mode`, `stratum`, `offset`, `offsetAbs`, `delay`, `serverTime`, `bytesReceived`, `responseTime` |

All time values are in milliseconds. `json` is the parsed response body when it is valid JSON. Expected header names are case-insensitive.

See the [configuration reference](#configuration-reference) for every request property and its default.

## Matchers

A scalar expectation means strict equality, an array means deep equality, and a plain object is a partial deep match where only the listed keys are checked:

```yaml
expect:
  headers:
    content-type: { $matches: "text/html" }
  json:
    data:
      user: { name: alice }
```

An object whose keys all start with `$` applies operators:

| Operator | Description | Example |
|----------|-------------|---------|
| `$eq`, `$ne` | Deep equality, inequality | `{ $ne: 500 }` |
| `$gt`, `$gte`, `$lt`, `$lte` | Numeric comparison | `{ $lt: 1000 }` |
| `$contains` | Substring, or array membership | `{ $contains: "<title>" }` |
| `$matches` | Regular expression | `{ $matches: "^SSH-2\\.0" }` |
| `$exists` | `true` must be present, `false` must be absent | `{ $exists: false }` |
| `$in` | Value is one of the listed options | `{ $in: [TLSv1.2, TLSv1.3] }` |
| `$length` | Length of string or array, accepts nested matchers | `{ $length: { $gte: 1 } }` |
| `$type` | `string`, `number`, `boolean`, `array`, `object`, or `null` | `{ $type: array }` |
| `$not` | Negate a nested matcher | `{ $not: { $in: [500, 503] } }` |

Each failure is reported with the dotted path of the mismatching field, e.g. `headers.content-type: expected match for /json/, got "text/html"`.

## Colophon

<!-- BEGIN:DEVELOPERS_GUIDE -->
[Developer's Guide](https://cliffano.github.io/developers-guide-nodejs.html)
<!-- END:DEVELOPERS_GUIDE -->

<!-- BEGIN:BUILD_REPORTS -->
Build reports:

* [Code complexity report](https://cliffano.github.io/health/complexity/plato/index.html)
* [Unit tests report](https://cliffano.github.io/health/test/mocha.txt)
* [Test coverage report](https://cliffano.github.io/health/coverage/c8/index.html)
* [Integration tests report](https://cliffano.github.io/health/test-integration/cmdt.txt)
* [API Documentation](https://cliffano.github.io/health/doc/jsdoc/index.html)

<!-- END:BUILD_REPORTS -->
