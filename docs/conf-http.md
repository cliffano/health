# HTTP and HTTPS configuration

Sends an HTTP/1.1 request using Node.js core `http` and `https` modules, follows redirects, and captures the final response. Both `http` and `https` protocol values use the same checker, the URL scheme decides whether TLS is used.

See [examples/http.yaml](../examples/http.yaml) for a complete example file, and the [README](../README.md) for expectation file shapes and matchers. Other protocols: [http2](conf-http2.md), [tcp](conf-tcp.md), [udp](conf-udp.md), [dns](conf-dns.md), [tls](conf-tls.md), [websocket](conf-websocket.md), [ntp](conf-ntp.md).

## Check properties

An expectation file has a single top-level `checks` array. Each item is one check, and checks of different protocols can be combined in the same file. These are the properties of a check item.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `name` | Check name shown in the CLI output and in results | String | No | `<protocol> <url>` | `My check` |
| `protocol` | Protocol to check, `http` or `https` | String | Yes | - | `http` |
| `request` | Request properties, see [Request properties](#request-properties) | Object | Yes | - | `{ url: https://google.com }` |
| `expect` | Expected response, see [Expect properties](#expect-properties), a check without expectations passes as long as the request succeeds | Object | No | `{}` | `{ status: 200 }` |

## Request properties

Properties of the `request` object, they define what to send and how.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `url` | Request URL, the scheme must be `http://` or `https://` | String | Yes | - | `https://google.com` |
| `method` | HTTP request method | String | No | `GET` | `POST` |
| `headers` | Request headers to send | Object | No | `{}` | `{ user-agent: health, accept: application/json }` |
| `body` | Request body to send, e.g. for `POST` and `PUT` | String | No | - | `'{"ping": 1}'` |
| `timeout` | Socket inactivity timeout in milliseconds, applied to each request including redirects | Number | No | `10000` | `5000` |
| `followRedirects` | Follow 3xx responses that have a `location` header | Boolean | No | `true` | `false` |
| `maxRedirects` | Maximum number of redirects to follow, the 3xx response is captured when the limit is reached | Number | No | `5` | `2` |
| `rejectUnauthorized` | Fail the request when the TLS certificate is invalid, set to `false` to check endpoints with self-signed certificates | Boolean | No | `true` | `false` |

## Expect properties

Properties of the `expect` object. Each one is a field captured from the response, and every field is optional: only the listed fields are verified. A value can be a plain value for equality, a nested object for partial matching, or a matcher such as `{ $lt: 1000 }`. Default and Mandatory don't apply to captured fields.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `url` | Final URL after following redirects | String | No | - | `https://www.google.com/` |
| `status` | Response status code | Number | No | - | `200` |
| `statusText` | Response status message | String | No | - | `OK` |
| `httpVersion` | HTTP version of the response | String | No | - | `"1.1"` |
| `headers` | Response headers, names are lowercase and expected names are matched case-insensitively, a repeated header such as `set-cookie` is an array | Object | No | - | `{ content-type: { $matches: "text/html" } }` |
| `headers.<name>` | A single response header value | String, Array | No | - | `{ $exists: true }` |
| `body` | Response body decoded as UTF-8, capped at 5 MB | String | No | - | `{ $contains: "<title>" }` |
| `bodyLength` | Size of the captured body in bytes | Number | No | - | `{ $gt: 1000 }` |
| `json` | Response body parsed as JSON, absent when the body is not valid JSON | Any | No | - | `{ data: { user: { name: alice } } }` |
| `redirects` | Number of redirects followed | Number | No | - | `1` |
| `responseTime` | Total time in milliseconds, including redirects | Number | No | - | `{ $lt: 5000 }` |
| `remoteAddress` | IP address of the server that sent the final response | String | No | - | `"142.250.70.196"` |
| `tls` | TLS details of the final response, absent for `http://` URLs | Object | No | - | `{ authorized: true }` |
| `tls.protocol` | Negotiated TLS version | String | No | - | `{ $in: [TLSv1.2, TLSv1.3] }` |
| `tls.cipher` | Negotiated cipher suite | String | No | - | `TLS_AES_256_GCM_SHA384` |
| `tls.authorized` | Whether the certificate chain is trusted | Boolean | No | - | `true` |
| `tls.certSubject` | Common name (CN) of the certificate subject | String | No | - | `{ $matches: "google" }` |
| `tls.certIssuer` | Common name (CN) of the certificate issuer | String | No | - | `{ $exists: true }` |
| `tls.certValidFrom` | Certificate validity start date | String | No | - | `"Nov  3 08:35:42 2026 GMT"` |
| `tls.certValidTo` | Certificate expiry date | String | No | - | `"Jan 26 08:35:41 2027 GMT"` |
| `tls.certDaysRemaining` | Whole days until the certificate expires, negative when expired | Number | No | - | `{ $gt: 14 }` |

## Notes

* A connection error or timeout fails the check with a `check failed: <reason>` message, regardless of the expectations.
* With `followRedirects: false`, assert on the redirect itself, e.g. `status: 301` and `headers: { location: https://example.com/ }`.

## Example

```yaml
checks:
  - name: Google homepage
    protocol: https
    request:
      url: https://google.com
      method: GET
      headers:
        user-agent: health
      timeout: 10000
      followRedirects: true
      maxRedirects: 5
    expect:
      status: 200
      redirects: 1
      responseTime: { $lt: 5000 }
      body: { $contains: "<title>" }
      headers:
        content-type: { $matches: "text/html" }
        x-powered-by: { $exists: false }
      tls:
        authorized: true
        certDaysRemaining: { $gt: 14 }
```
