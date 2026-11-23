# UDP configuration

Sends a single datagram using Node.js core `dgram` module and waits for the first response datagram. UDP is connectionless, so no response may mean the service is down, the packet was dropped, or the service never replies to that payload. Assert on `responded` either way.

See [examples/udp.yaml](../examples/udp.yaml) for a complete example file, and the [README](../README.md) for expectation file shapes and matchers. Other protocols: [http](conf-http.md), [http2](conf-http2.md), [tcp](conf-tcp.md), [dns](conf-dns.md), [tls](conf-tls.md), [websocket](conf-websocket.md), [ntp](conf-ntp.md).

## Check properties

Properties of each check, either at the top level of a YAML document or as an item of a `checks` array.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `name` | Check name shown in the CLI output and in results | String | No | `udp <host>:<port>` | `My check` |
| `protocol` | Protocol to check, `udp` | String | Yes | - | `udp` |
| `request` | Request properties, see [Request properties](#request-properties) | Object | Yes | - | `{ host: 127.0.0.1, port: 8125, send: ping }` |
| `expect` | Expected response, see [Expect properties](#expect-properties), a check without expectations passes as long as the request succeeds | Object | No | `{}` | `{ responded: true }` |

## Request properties

Properties of the `request` object, they define what to send and how.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `host` | Host name or IP address to send to | String | Yes | - | `8.8.8.8` |
| `port` | Port to send to | Number | Yes | - | `53` |
| `send` | Text payload to send | String | No | `""` | `"health.ping:1\|c"` |
| `sendHex` | Payload as a hex string, takes precedence over `send` | String | No | - | `"abcd0100000100000000000006676f6f676c6503636f6d0000010001"` |
| `timeout` | Time in milliseconds to wait for a response | Number | No | `3000` | `1000` |
| `type` | Socket type, `udp4` for IPv4 or `udp6` for IPv6 | String | No | `udp4` | `udp6` |
| `encoding` | Encoding used to decode the response into `data`, any Node.js Buffer encoding | String | No | `utf8` | `latin1` |

## Expect properties

Properties of the `expect` object. Each one is a field captured from the response, and every field is optional: only the listed fields are verified. A value can be a plain value for equality, a nested object for partial matching, or a matcher such as `{ $lt: 1000 }`. Default and Mandatory don't apply to captured fields.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `responded` | Whether a response arrived before `timeout` | Boolean | No | - | `true` |
| `responseTime` | Time in milliseconds until the response, or until the timeout when there is none | Number | No | - | `{ $lt: 500 }` |
| `data` | Response decoded with `encoding`, empty when there is no response | String | No | - | `{ $contains: "pong" }` |
| `dataHex` | Response as a hex string, empty when there is no response | String | No | - | `{ $matches: "^abcd" }` |
| `bytesReceived` | Size of the response in bytes, `0` when there is no response | Number | No | - | `{ $gt: 12 }` |
| `remoteAddress` | IP address the response came from, absent when there is no response | String | No | - | `"8.8.8.8"` |
| `remotePort` | Port the response came from, absent when there is no response | Number | No | - | `53` |

## Notes

* No response is a valid result rather than an error, a check with `responded: false` passes for fire-and-forget services such as StatsD.
* A socket or send error, e.g. an unresolvable host, fails the check with a `check failed: <reason>` message.

## Example

```yaml
name: Google public DNS answers over UDP
protocol: udp
request:
  host: 8.8.8.8
  port: 53
  sendHex: "abcd0100000100000000000006676f6f676c6503636f6d0000010001"
  timeout: 3000
  type: udp4
expect:
  responded: true
  responseTime: { $lt: 500 }
  bytesReceived: { $gt: 12 }
  dataHex: { $matches: "^abcd" }
```
