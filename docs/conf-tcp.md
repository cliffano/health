# TCP configuration

Opens a TCP connection using Node.js core `net` module, optionally sends a payload, then collects whatever the server sends until it closes the connection or `readTimeout` elapses. Handy for port checks and for banner protocols such as SSH, SMTP, FTP, POP3, IMAP and Redis.

See [examples/tcp.yaml](../examples/tcp.yaml) for a complete example file, and the [README](../README.md) for expectation file shapes and matchers. Other protocols: [http](conf-http.md), [http2](conf-http2.md), [udp](conf-udp.md), [dns](conf-dns.md), [tls](conf-tls.md), [websocket](conf-websocket.md), [ntp](conf-ntp.md).

## Check properties

An expectation file has a single top-level `checks` array. Each item is one check, and checks of different protocols can be combined in the same file. These are the properties of a check item.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `name` | Check name shown in the CLI output and in results | String | No | `tcp <host>:<port>` | `My check` |
| `protocol` | Protocol to check, `tcp` | String | Yes | - | `tcp` |
| `request` | Request properties, see [Request properties](#request-properties) | Object | Yes | - | `{ host: github.com, port: 22 }` |
| `expect` | Expected response, see [Expect properties](#expect-properties), a check without expectations passes as long as the request succeeds | Object | No | `{}` | `{ connected: true }` |

## Request properties

Properties of the `request` object, they define what to send and how.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `host` | Host name or IP address to connect to | String | Yes | - | `github.com` |
| `port` | Port to connect to | Number | Yes | - | `22` |
| `send` | Text payload to send once connected | String | No | - | `"PING\r\n"` |
| `sendHex` | Payload as a hex string, takes precedence over `send` | String | No | - | `"2a310d0a24340d0a50494e470d0a"` |
| `timeout` | Connect timeout in milliseconds, also ends data collection when the socket goes idle after connecting | Number | No | `5000` | `3000` |
| `readTimeout` | Time in milliseconds to collect data after connecting | Number | No | `2000` | `500` |
| `encoding` | Encoding used to decode received bytes into `data`, any Node.js Buffer encoding | String | No | `utf8` | `latin1` |

## Expect properties

Properties of the `expect` object. Each one is a field captured from the response, and every field is optional: only the listed fields are verified. A value can be a plain value for equality, a nested object for partial matching, or a matcher such as `{ $lt: 1000 }`. Default and Mandatory don't apply to captured fields.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `connected` | Whether the connection was established | Boolean | No | - | `true` |
| `connectTime` | Time in milliseconds to establish the connection | Number | No | - | `{ $lt: 1000 }` |
| `responseTime` | Total time in milliseconds, including data collection | Number | No | - | `{ $lt: 3000 }` |
| `remoteAddress` | IP address of the server | String | No | - | `"140.82.112.3"` |
| `remoteFamily` | IP family of the server address | String | No | - | `IPv4` |
| `data` | Received bytes decoded with `encoding` | String | No | - | `{ $matches: "^SSH-2\\.0" }` |
| `dataHex` | Received bytes as a hex string | String | No | - | `{ $matches: "^2b504f4e47" }` |
| `bytesReceived` | Number of bytes received | Number | No | - | `{ $gt: 0 }` |

## Notes

* A refused connection or connect timeout fails the check with a `check failed: <reason>` message, so `connected: false` can't be asserted, use a failing check instead.
* Data collection always waits for `readTimeout` unless the server closes the connection first, lower it to speed up checks of servers that send a banner straight away.

## Example

```yaml
checks:
  - name: SSH port open
    protocol: tcp
    request:
      host: github.com
      port: 22
      timeout: 5000
      readTimeout: 2000
    expect:
      connected: true
      connectTime: { $lt: 1000 }
      data: { $matches: "^SSH-2\\.0" }
      bytesReceived: { $gt: 0 }
```
