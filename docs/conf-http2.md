# HTTP/2 configuration

Sends an HTTP/2 request using Node.js core `http2` module. An `https://` URL negotiates h2 over TLS via ALPN, an `http://` URL uses plaintext h2c. Redirects are not followed.

See [examples/http2.yaml](../examples/http2.yaml) for a complete example file, and the [README](../README.md) for expectation file shapes and matchers. Other protocols: [http](conf-http.md), [tcp](conf-tcp.md), [udp](conf-udp.md), [dns](conf-dns.md), [tls](conf-tls.md), [websocket](conf-websocket.md), [ntp](conf-ntp.md).

## Check properties

Properties of each check, either at the top level of a YAML document or as an item of a `checks` array.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `name` | Check name shown in the CLI output and in results | String | No | `http2 <url>` | `My check` |
| `protocol` | Protocol to check, `http2` | String | Yes | - | `http2` |
| `request` | Request properties, see [Request properties](#request-properties) | Object | Yes | - | `{ url: https://www.google.com/ }` |
| `expect` | Expected response, see [Expect properties](#expect-properties), a check without expectations passes as long as the request succeeds | Object | No | `{}` | `{ status: 200 }` |

## Request properties

Properties of the `request` object, they define what to send and how.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `url` | Request URL, `https://` for h2 over TLS or `http://` for plaintext h2c | String | Yes | - | `https://www.google.com/` |
| `method` | HTTP request method, sent as the `:method` pseudo-header | String | No | `GET` | `POST` |
| `headers` | Request headers to send, names should be lowercase as required by HTTP/2 | Object | No | `{}` | `{ user-agent: health }` |
| `body` | Request body to send | String | No | - | `'{"ping": 1}'` |
| `timeout` | Timeout in milliseconds for the whole exchange, from connecting until the response ends | Number | No | `10000` | `5000` |
| `rejectUnauthorized` | Fail the request when the TLS certificate is invalid | Boolean | No | `true` | `false` |

## Expect properties

Properties of the `expect` object. Each one is a field captured from the response, and every field is optional: only the listed fields are verified. A value can be a plain value for equality, a nested object for partial matching, or a matcher such as `{ $lt: 1000 }`. Default and Mandatory don't apply to captured fields.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `url` | Requested URL | String | No | - | `https://www.google.com/` |
| `status` | Response status code, from the `:status` pseudo-header | Number | No | - | `200` |
| `httpVersion` | Always `2.0` | String | No | - | `"2.0"` |
| `alpnProtocol` | Protocol negotiated via ALPN, `h2` over TLS, absent for h2c | String | No | - | `h2` |
| `headers` | Response headers without pseudo-headers, names are lowercase | Object | No | - | `{ content-type: application/json }` |
| `headers.<name>` | A single response header value | String, Array | No | - | `{ $exists: true }` |
| `body` | Response body decoded as UTF-8, capped at 5 MB | String | No | - | `{ $contains: "<title>" }` |
| `bodyLength` | Size of the captured body in bytes | Number | No | - | `{ $gt: 0 }` |
| `json` | Response body parsed as JSON, absent when the body is not valid JSON | Any | No | - | `{ status: ok }` |
| `responseTime` | Total time in milliseconds | Number | No | - | `{ $lt: 5000 }` |

## Notes

* A connection error, stream error or timeout fails the check with a `check failed: <reason>` message, regardless of the expectations.
* Use `alpnProtocol: h2` to confirm that the server really negotiated HTTP/2.

## Example

```yaml
name: Google speaks HTTP/2
protocol: http2
request:
  url: https://www.google.com/
  method: GET
  timeout: 10000
expect:
  status: 200
  httpVersion: "2.0"
  alpnProtocol: h2
  headers:
    content-type: { $matches: "text/html" }
  responseTime: { $lt: 5000 }
```
