Health [![Build Status](https://secure.travis-ci.org/cliffano/health.png?branch=master)](http://travis-ci.org/cliffano/health) [![Dependencies Status](https://david-dm.org/cliffano/health.png)](http://david-dm.org/cliffano/health) [![Published Version](https://badge.fury.io/js/health.png)](http://badge.fury.io/js/health)
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

From command-line:

    health -f html -s health.json check

Configuration
-------------

Health setup is just a simple JSON:

    [
      { "name": "Google", "uri", "http://google.com", "statusCodes": [ 200 ] },
      { "name": "GMail", "uri", "https://mail.google.com", "timeout": "1000" },
      { "name": "MongoDB", "uri": "mongodb://somehost:27017", "timeout": 200, "ttl": 30000 },
      { "name": "Temp", "uri": "file:///tmp", "mode": "777", "ttl": 360000 }
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
    <td>lenient</td>
    <td>boolean</td>
    <td>Replace fail or error with warning</td>
    <td>All</td>
    <td>Optional</td>
    <td>false</td>
    <td>true, false</td>
  </tr>
  <tr>
    <td>group</td>
    <td>string</td>
    <td>Resource group name, status is set to warning when there's at least one group member having success/warning status, group members status is set to fail/error only when none of the group members has success/warning status</td>
    <td>All</td>
    <td>Optional</td>
    <td></td>
    <td>databases, apps, datacenter1</td>
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
    <td>statusCode</td>
    <td>array</td>
    <td>An array of acceptable response HTTP status codes</td>
    <td>http, https</td>
    <td>Optional</td>
    <td></td>
    <td>[ 200, 409 ]</td>
  </tr>
  <tr>
    <td>text</td>
    <td>array</td>
    <td>An array of all texts that must exist in response body, any of them does not exist means status FAIL</td>
    <td>http, https</td>
    <td>Optional</td>
    <td></td>
    <td>[ 'foo', 'bar' ]</td>
  </tr>
  <tr>
    <td>mode</td>
    <td>string</td>
    <td>3-digit file/directory mode</td>
    <td>file</td>
    <td>Optional</td>
    <td></td>
    <td>777, 644</td>
  </tr>
</table>
