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

Health is a resource health status checking library.

This is handy when you want to check the status of multiple resources using a simple configuration file. For example, if your application requires a web service and a MongoDB database to be available, Health module can monitor those resources and return status ok/fail against each resource along with the response time.

It also supports result caching via ttl attribute of each resource, which is handy when you want to monitor multiple resources at a different interval or to reduce the load on certain resources.

## Installation

```bash
npm install -g health
```

## Usage

```javascript
import Health from "health";

// use default formatter
const health1 = new Health({
  setup: [{ name: "google", uri: "http://google.com" }],
});

// use built-in formatter (cli, html, or text)
const health2 = new Health({
  setup: [{ name: "google", uri: "http://google.com" }],
  formatter: "html",
});

// use custom formatter function
const health3 = new Health({
  setup: [{ name: "google", uri: "http://google.com" }],
  formatter: function (results) {
    return results.join("|");
  },
});

// check resources
health1.check(function (err, result) {});
```

From command-line:

```bash
health check --setup-file health.json --formatter html
```

Show help guide:

```bash
health --help
```

## Configuration

Health setup is just a simple JSON:

```json
[
  { "name": "Google", "uri": "http://google.com", "statusCode": [200] },
  { "name": "GMail", "uri": "https://mail.google.com", "timeout": 1000 },
  { "name": "MongoDB", "uri": "mongodb://somehost:27017", "timeout": 200, "ttl": 30000 },
  { "name": "Temp", "uri": "file:///tmp", "mode": "777", "ttl": 360000 }
]
```

| Attribute | Type | Description | Protocol | Usage | Default | Example |
|-----------|------|--------------|----------|-------|---------|---------|
| `uri` | string | Resource URI to check | All | Mandatory | | `mongodb://somehost:27017` |
| `name` | string | Resource name | All | Optional | | `someapp` |
| `ttl` | number | Cache time to live in milliseconds | All | Optional | | `30000` |
| `lenient` | boolean | Replace fail or error with warning | All | Optional | `false` | `true`, `false` |
| `group` | string | Resource group name, status is set to warning when there's at least one group member having success/warning status, group members status is set to fail/error only when none of the group members has success/warning status | All | Optional | | `databases`, `apps`, `datacenter1` |
| `timeout` | number | Request/connect timeout in milliseconds | http, https, mongodb | Optional | | `500` |
| `statusCode` | array | An array of acceptable response HTTP status codes | http, https | Optional | | `[200, 409]` |
| `text` | array | An array of all texts that must exist in response body, any of them does not exist means status FAIL | http, https | Optional | | `['foo', 'bar']` |
| `mode` | string | 3-digit file/directory mode | file | Optional | | `777`, `644` |

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
