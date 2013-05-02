Health [![Build Status](https://secure.travis-ci.org/cliffano/health.png?branch=master)](http://travis-ci.org/cliffano/health) [![Dependencies Status](https://david-dm.org/cliffano/health.png)](http://david-dm.org/cliffano/health)
-----------
<img align="right" src="https://raw.github.com/cliffano/health/master/avatar.jpg" alt="Avatar"/>

Health is a resource status monitoring library.

This is handy when you want to monitor the status of multiple resources using a simple configuration file. For example, if your application requires a web service and a MongoDB database to be available, Health module can monitor those resources and return status ok/fail against each resource along with the response time.

It also supports result caching via ttl attribe of each resource, which is handy when you want to monitor multiple resources at a different interval or to reduce the load on certain resources.

Installation
------------

    npm install -g health 

Usage
-----

    // use default formatter
    var health = new (require('health'))(
      setup: [ { name: 'google', uri: 'http://google.com' } ]
    );

    // use built-in formatter (html, text, or xml)
    var health = new (require('health'))(
      setup: [ { name: 'google', uri: 'http://google.com' } ],
      formatter: 'html'
    );

    // use custom formatter function
    var health = new (require('health'))(
      setup: [ { name: 'google', uri: 'http://google.com' } ],
      formatter: function (results) {
        return results.join('|');
      }
    );

    // check resources
    health.check(function (err, result) {
    });

Configuration
-------------

Health setup is just a simple JSON:

    [
      { "name": "google", "uri", "http://google.com", "statusCodes": [ 200 ] },
      { "name": "gmail", "uri", "https://mail.google.com", "timeout": "1000" },
      { "name": "mongodb", "uri": "mongodb://somehost:27017", "timeout": 200, "ttl": 30000 }
    ]

<table>
  <tr>
    <th>Attribute</th>
    <th>Type</th>
    <th>Description</th>
    <th>Protocol</th>
    <th>Usage</th>
    <th>Default</th>
    <th>Example</th>
  </tr>
  <tr>
    <td>uri</td>
    <td>string</td>
    <td>Resource URI to check</td>
    <td>All</td>
    <td>Mandatory</td>
    <td></td>
    <td>mongodb://somehost:27017</td>
  </tr>
  <tr>
    <td>name</td>
    <td>string</td>
    <td>Resource name</td>
    <td>All</td>
    <td>Optional</td>
    <td></td>
    <td>someapp</td>
  </tr>
  <tr>
    <td>ttl</td>
    <td>number</td>
    <td>Cache time to live in milliseconds</td>
    <td>All</td>
    <td>Optional</td>
    <td></td>
    <td>30000</td>
  </tr>
  <tr>
    <td>timeout</td>
    <td>number</td>
    <td>Request/connect timeout in milliseconds</td>
    <td>http, https, mongodb</td>
    <td>Optional</td>
    <td></td>
    <td>500</td>
  </tr>
  <tr>
    <td>statusCodes</td>
    <td>array</td>
    <td>An array of acceptable response HTTP status codes, any match means status OK</td>
    <td>http, https</td>
    <td>Optional</td>
    <td></td>
    <td>[ 200, '3xx', 409 ]</td>
  </tr>
  <tr>
    <td>texts</td>
    <td>array</td>
    <td>An array of all texts that must exist in response body, any of them does not exist means status FAIL</td>
    <td>http, https</td>
    <td>Optional</td>
    <td></td>
    <td>[ 'foo', 'bar' ]</td>
  </tr>
</table>
