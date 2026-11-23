# NTP configuration

Queries an NTP server using a single SNTP request over Node.js core `dgram` module, then computes the local clock offset and round-trip delay as defined in RFC 4330.

See [examples/ntp.yaml](../examples/ntp.yaml) for a complete example file, and the [README](../README.md) for expectation file shapes and matchers. Other protocols: [http](conf-http.md), [http2](conf-http2.md), [tcp](conf-tcp.md), [udp](conf-udp.md), [dns](conf-dns.md), [tls](conf-tls.md), [websocket](conf-websocket.md).

## Check properties

An expectation file has a single top-level `checks` array. Each item is one check, and checks of different protocols can be combined in the same file. These are the properties of a check item.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `name` | Check name shown in the CLI output and in results | String | No | `ntp <host>:<port>` | `My check` |
| `protocol` | Protocol to check, `ntp` | String | Yes | - | `ntp` |
| `request` | Request properties, see [Request properties](#request-properties) | Object | Yes | - | `{ host: pool.ntp.org }` |
| `expect` | Expected response, see [Expect properties](#expect-properties), a check without expectations passes as long as the request succeeds | Object | No | `{}` | `{ valid: true }` |

## Request properties

Properties of the `request` object, they define what to send and how.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `host` | NTP server host name or IP address | String | Yes | - | `pool.ntp.org` |
| `port` | NTP server port | Number | No | `123` | `123` |
| `timeout` | Time in milliseconds to wait for a response | Number | No | `3000` | `2000` |

## Expect properties

Properties of the `expect` object. Each one is a field captured from the response, and every field is optional: only the listed fields are verified. A value can be a plain value for equality, a nested object for partial matching, or a matcher such as `{ $lt: 1000 }`. Default and Mandatory don't apply to captured fields.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `responded` | Whether a response arrived before `timeout` | Boolean | No | - | `true` |
| `valid` | Whether the response is a server response (mode 4) with a stratum between 1 and 15, `false` too when the packet is shorter than 48 bytes | Boolean | No | - | `true` |
| `leapIndicator` | Leap second indicator, `0` no warning, `1` last minute has 61 seconds, `2` last minute has 59 seconds, `3` clock unsynchronised | Number | No | - | `{ $ne: 3 }` |
| `version` | NTP version of the response | Number | No | - | `4` |
| `mode` | NTP mode of the response, `4` means server | Number | No | - | `4` |
| `stratum` | Distance from the reference clock, `1` is a primary server | Number | No | - | `{ $lte: 4 }` |
| `offset` | Clock offset in milliseconds, positive when the server is ahead of the local clock | Number | No | - | `{ $gt: -1000, $lt: 1000 }` |
| `offsetAbs` | Absolute clock offset in milliseconds | Number | No | - | `{ $lt: 5000 }` |
| `delay` | Round-trip network delay in milliseconds | Number | No | - | `{ $lt: 1000 }` |
| `serverTime` | Server transmit time, ISO 8601 | String | No | - | `{ $matches: "^2026-" }` |
| `bytesReceived` | Size of the response in bytes | Number | No | - | `48` |
| `responseTime` | Time in milliseconds until the response, equals `timeout` when there is no response | Number | No | - | `{ $lt: 500 }` |

## Notes

* No response is a valid result rather than an error, only `responded` and `responseTime` are available then.
* A short packet only has `responded`, `valid: false`, and `bytesReceived`.
* A socket or send error, e.g. an unresolvable host, fails the check with a `check failed: <reason>` message.

## Example

```yaml
checks:
  - name: pool.ntp.org is healthy and clock is in sync
    protocol: ntp
    request:
      host: pool.ntp.org
      port: 123
      timeout: 3000
    expect:
      responded: true
      valid: true
      stratum: { $lte: 4 }
      leapIndicator: { $ne: 3 }
      offsetAbs: { $lt: 5000 }
      delay: { $lt: 1000 }
```
