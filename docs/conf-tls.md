# TLS configuration

Performs a TLS handshake using Node.js core `tls` module and captures handshake and certificate details, without sending any application data. Works against any TLS port, e.g. HTTPS, SMTPS, IMAPS, LDAPS, and database TLS endpoints.

See [examples/tls.yaml](../examples/tls.yaml) for a complete example file, and the [README](../README.md) for expectation file shapes and matchers. Other protocols: [http](conf-http.md), [http2](conf-http2.md), [tcp](conf-tcp.md), [udp](conf-udp.md), [dns](conf-dns.md), [websocket](conf-websocket.md), [ntp](conf-ntp.md).

## Check properties

Properties of each check, either at the top level of a YAML document or as an item of a `checks` array.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `name` | Check name shown in the CLI output and in results | String | No | `tls <host>:<port>` | `My check` |
| `protocol` | Protocol to check, `tls` | String | Yes | - | `tls` |
| `request` | Request properties, see [Request properties](#request-properties) | Object | Yes | - | `{ host: google.com, port: 443 }` |
| `expect` | Expected response, see [Expect properties](#expect-properties), a check without expectations passes as long as the request succeeds | Object | No | `{}` | `{ authorized: true }` |

## Request properties

Properties of the `request` object, they define what to send and how.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `host` | Host name or IP address to connect to | String | Yes | - | `smtp.gmail.com` |
| `port` | Port to connect to | Number | No | `443` | `465` |
| `servername` | Server name sent via SNI, also used for certificate verification | String | No | `host` | `www.google.com` |
| `alpnProtocols` | Protocols to offer via ALPN, the selected one is reported as `alpnProtocol` | Array | No | - | `[h2, http/1.1]` |
| `timeout` | Connect timeout in milliseconds | Number | No | `5000` | `3000` |
| `rejectUnauthorized` | Fail the handshake when the certificate is invalid, keep it `false` to assert on `authorized` and inspect invalid certificates instead | Boolean | No | `false` | `true` |

## Expect properties

Properties of the `expect` object. Each one is a field captured from the response, and every field is optional: only the listed fields are verified. A value can be a plain value for equality, a nested object for partial matching, or a matcher such as `{ $lt: 1000 }`. Default and Mandatory don't apply to captured fields.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `connected` | Whether the handshake completed | Boolean | No | - | `true` |
| `authorized` | Whether the certificate chain is trusted and matches `servername` | Boolean | No | - | `true` |
| `authorizationError` | Reason the certificate isn't trusted, absent when authorized | String | No | - | `{ $exists: false }` |
| `protocol` | Negotiated TLS version | String | No | - | `{ $in: [TLSv1.2, TLSv1.3] }` |
| `cipher` | Negotiated cipher suite | String | No | - | `TLS_AES_256_GCM_SHA384` |
| `cipherVersion` | TLS version the cipher suite was defined in | String | No | - | `TLSv1.3` |
| `alpnProtocol` | Protocol selected via ALPN, absent when `alpnProtocols` isn't specified or nothing was selected | String | No | - | `h2` |
| `servername` | Server name that was sent via SNI | String | No | - | `google.com` |
| `responseTime` | Handshake time in milliseconds | Number | No | - | `{ $lt: 3000 }` |
| `cert` | Certificate details, absent when the server presents no certificate | Object | No | - | `{ daysRemaining: { $gt: 14 } }` |
| `cert.subject` | Common name (CN) of the certificate subject | String | No | - | `{ $matches: "google" }` |
| `cert.issuer` | Common name (CN) of the certificate issuer | String | No | - | `"WR2"` |
| `cert.subjectAltName` | Subject alternative names, comma separated | String | No | - | `{ $contains: "DNS:*.google.com" }` |
| `cert.validFrom` | Certificate validity start date | String | No | - | `"Nov  3 08:35:42 2026 GMT"` |
| `cert.validTo` | Certificate expiry date | String | No | - | `"Jan 26 08:35:41 2027 GMT"` |
| `cert.daysRemaining` | Whole days until the certificate expires, negative when expired | Number | No | - | `{ $gt: 14 }` |
| `cert.serialNumber` | Certificate serial number, uppercase hex | String | No | - | `"5ADD59981FD45DF78EE18C4F627A8839F19606A2"` |
| `cert.fingerprint256` | SHA-256 fingerprint, colon separated uppercase hex | String | No | - | `"28:CB:33:D1:...:6E:E3"` |

## Notes

* A refused connection, timeout, or, with `rejectUnauthorized: true`, an invalid certificate fails the check with a `check failed: <reason>` message.
* Typical `authorizationError` values are `CERT_HAS_EXPIRED`, `DEPTH_ZERO_SELF_SIGNED_CERT`, `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, and `ERR_TLS_CERT_ALTNAME_INVALID`.
* Pin a certificate with `cert: { fingerprint256: "28:CB:..." }` to detect unexpected certificate changes.

## Example

```yaml
name: google.com certificate healthy
protocol: tls
request:
  host: google.com
  port: 443
  servername: google.com
  alpnProtocols: [h2, http/1.1]
  timeout: 5000
expect:
  connected: true
  authorized: true
  protocol: { $in: [TLSv1.2, TLSv1.3] }
  alpnProtocol: h2
  cert:
    subject: { $matches: "google" }
    daysRemaining: { $gt: 14 }
```
