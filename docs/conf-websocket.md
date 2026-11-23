# WebSocket configuration

Opens a WebSocket connection using the Node.js global `WebSocket` client, optionally sends a message, and captures the first message received. `ws` is an alias of `websocket`. Requires Node.js 22 or newer.

See [examples/websocket.yaml](../examples/websocket.yaml) for a complete example file, and the [README](../README.md) for expectation file shapes and matchers. Other protocols: [http](conf-http.md), [http2](conf-http2.md), [tcp](conf-tcp.md), [udp](conf-udp.md), [dns](conf-dns.md), [tls](conf-tls.md), [ntp](conf-ntp.md).

## Check properties

An expectation file has a single top-level `checks` array. Each item is one check, and checks of different protocols can be combined in the same file. These are the properties of a check item.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `name` | Check name shown in the CLI output and in results | String | No | `<protocol> <url>` | `My check` |
| `protocol` | Protocol to check, `websocket` or `ws` | String | Yes | - | `websocket` |
| `request` | Request properties, see [Request properties](#request-properties) | Object | Yes | - | `{ url: wss://echo.websocket.org }` |
| `expect` | Expected response, see [Expect properties](#expect-properties), a check without expectations passes as long as the request succeeds | Object | No | `{}` | `{ messageReceived: true }` |

## Request properties

Properties of the `request` object, they define what to send and how.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `url` | WebSocket URL, the scheme must be `ws://` or `wss://` | String | Yes | - | `wss://echo.websocket.org` |
| `subprotocols` | Subprotocol to offer, or a list of subprotocols | String, Array | No | - | `[graphql-ws, chat]` |
| `send` | Message to send as soon as the connection is open | String | No | - | `"ping from health"` |
| `timeout` | Connect timeout in milliseconds | Number | No | `5000` | `3000` |
| `messageTimeout` | Time in milliseconds to wait for the first message after connecting | Number | No | `2000` | `3000` |

## Expect properties

Properties of the `expect` object. Each one is a field captured from the response, and every field is optional: only the listed fields are verified. A value can be a plain value for equality, a nested object for partial matching, or a matcher such as `{ $lt: 1000 }`. Default and Mandatory don't apply to captured fields.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `connected` | Whether the connection was established | Boolean | No | - | `true` |
| `connectTime` | Time in milliseconds to establish the connection | Number | No | - | `{ $lt: 3000 }` |
| `protocol` | Subprotocol selected by the server, absent when none | String | No | - | `graphql-ws` |
| `extensions` | Extensions selected by the server, absent when none | String | No | - | `permessage-deflate` |
| `messageReceived` | Whether a message arrived within `messageTimeout` | Boolean | No | - | `true` |
| `message` | First message received, empty when there is none | String | No | - | `{ $contains: "health" }` |
| `responseTime` | Total time in milliseconds, until the first message or `messageTimeout` | Number | No | - | `{ $lt: 5000 }` |

## Notes

* A failed handshake or connect timeout fails the check with a `check failed: <reason>` message.
* Only the first message is captured, binary messages are converted to a string.

## Example

```yaml
checks:
  - name: Echo server round-trip
    protocol: websocket
    request:
      url: wss://echo.websocket.org
      send: "ping from health"
      timeout: 5000
      messageTimeout: 3000
    expect:
      connected: true
      connectTime: { $lt: 3000 }
      messageReceived: true
      message: { $contains: "health" }
```
