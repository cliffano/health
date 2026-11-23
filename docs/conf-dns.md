# DNS configuration

Resolves DNS records using Node.js core `dns` module, either through the system resolver configuration or through specific DNS servers.

See [examples/dns.yaml](../examples/dns.yaml) for a complete example file, and the [README](../README.md) for expectation file shapes and matchers. Other protocols: [http](conf-http.md), [http2](conf-http2.md), [tcp](conf-tcp.md), [udp](conf-udp.md), [tls](conf-tls.md), [websocket](conf-websocket.md), [ntp](conf-ntp.md).

## Check properties

An expectation file has a single top-level `checks` array. Each item is one check, and checks of different protocols can be combined in the same file. These are the properties of a check item.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `name` | Check name shown in the CLI output and in results | String | No | `dns <name>` | `My check` |
| `protocol` | Protocol to check, `dns` | String | Yes | - | `dns` |
| `request` | Request properties, see [Request properties](#request-properties) | Object | Yes | - | `{ name: google.com, rrtype: MX }` |
| `expect` | Expected response, see [Expect properties](#expect-properties), a check without expectations passes as long as the request succeeds | Object | No | `{}` | `{ count: { $gte: 1 } }` |

## Request properties

Properties of the `request` object, they define what to send and how.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `name` | Domain name to resolve, or an IP address for `PTR` lookups in reverse notation | String | Yes | - | `google.com` |
| `rrtype` | Record type, `A`, `AAAA`, `CNAME`, `MX`, `NS`, `TXT`, `SOA`, `SRV`, `PTR`, or `CAA`, case-insensitive | String | No | `A` | `MX` |
| `server` | DNS server to query, or a list of servers, as IP addresses with optional port | String, Array | No | `system resolver` | `[8.8.8.8, 1.1.1.1]` |
| `timeout` | Query timeout in milliseconds | Number | No | `5000` | `2000` |

## Expect properties

Properties of the `expect` object. Each one is a field captured from the response, and every field is optional: only the listed fields are verified. A value can be a plain value for equality, a nested object for partial matching, or a matcher such as `{ $lt: 1000 }`. Default and Mandatory don't apply to captured fields.

| Name | Description | Type | Mandatory | Default | Example |
|------|------|------|------|------|------|
| `name` | Resolved name | String | No | - | `google.com` |
| `rrtype` | Record type, uppercase | String | No | - | `MX` |
| `records` | Resolved records, see Record shapes below | Array, Object | No | - | `{ $contains: { exchange: gmail-smtp-in.l.google.com, priority: 5 } }` |
| `count` | Number of records, `1` for `SOA` | Number | No | - | `{ $gte: 1 }` |
| `responseTime` | Resolution time in milliseconds | Number | No | - | `{ $lt: 2000 }` |

## Record shapes

| Record type | Shape of each item in `records` | Example |
|------|------|------|
| `A`, `AAAA` | IP address string | `142.250.70.206` |
| `CNAME`, `NS`, `PTR` | Host name string | `ns1.google.com` |
| `TXT` | String, with the record's chunks joined | `v=spf1 include:_spf.google.com ~all` |
| `MX` | Object with `exchange` and `priority` | `{ exchange: smtp.google.com, priority: 10 }` |
| `SRV` | Object with `name`, `port`, `priority`, and `weight` | `{ name: sip.example.com, port: 5060, priority: 10, weight: 5 }` |
| `CAA` | Object with `critical` and one of `issue`, `issuewild`, or `iodef` | `{ critical: 0, issue: pki.goog }` |
| `SOA` | A single object rather than an array, with `nsname`, `hostmaster`, `serial`, `refresh`, `retry`, `expire`, and `minttl` | `{ nsname: ns1.google.com }` |

## Notes

* A name that doesn't exist (`ENOTFOUND`), a missing record type (`ENODATA`) or a timeout fails the check with a `check failed: <reason>` message.
* `$contains` compares whole records with deep equality, so list every property of an `MX` or `SRV` record, e.g. `{ $contains: { exchange: smtp.google.com, priority: 10 } }`. An array expectation such as `records: [1.2.3.4]` requires the exact list in order.

## Example

```yaml
checks:
  - name: gmail MX records point at Google
    protocol: dns
    request:
      name: gmail.com
      rrtype: MX
      server: 8.8.8.8
      timeout: 5000
    expect:
      count: { $gte: 1 }
      records:
        $contains: { exchange: gmail-smtp-in.l.google.com, priority: 5 }
      responseTime: { $lt: 2000 }
```
