Health [![Build Status](https://secure.travis-ci.org/cliffano/health.png?branch=master)](http://travis-ci.org/cliffano/health) [![Dependencies Status](https://david-dm.org/cliffano/health.png)](http://david-dm.org/cliffano/health)
-----------
<img align="right" src="https://raw.github.com/cliffano/health/master/avatar.jpg" alt="Avatar"/>

Health is a resource status monitoring library.

Installation
------------

    npm install -g health 

Usage
-----

    var health = new (require('health'))(
      setup: [
        { name: 'google', uri: 'http://google.com' },
        { name: 'gmail', uri: 'https://mail.google.com' }
      ]
    );

Configuration
-------------

Health setup is just a simple JSON:

    [
      { "name": "google", "uri", "http://google.com", "statusCodes": [ 200 ] },
      { "name": "gmail", "uri", "https://mail.google.com", "timeout": "1000" },
    ]

<table>
  <tr>
    <th>Attribute</th>
    <th>Sample values</th>
    <th>Description</th>
    <th>Checker</th>
    <th>Status</th>
  </tr>
  <tr>
    <td>uri</td>
    <td>
      http://google.com<br/>
      https://mail.google.com<br/>
      mongodb://somehost:27017</td>
    <td>Resource URI to be checked</td>
    <td>All</td>
    <td>Mandatory</td>
  </tr>
  <tr>
    <td>name</td>
    <td>someapp</td>
    <td>Resource name</td>
    <td>All</td>
    <td>Optional</td>
  </tr>
  <tr>
    <td>timeout</td>
    <td>1000</td>
    <td>Request/connect timeout in milliseconds</td>
    <td>http, https, mongodb</td>
    <td>Optional</td>
  </tr>
  <tr>
    <td>statusCodes</td>
    <td>[ 200, '3xx', 409 ]</td>
    <td>An array of acceptable response HTTP status codes, any match means status OK</td>
    <td>http, https</td>
    <td>Optional</td>
  </tr>
  <tr>
    <td>texts</td>
    <td>[ 'must exist', 'this must also exist' ]</td>
    <td>An array of all texts that must exist in response body, any miss means status FAIL</td>
    <td>http, https</td>
    <td>Optional</td>
  </tr>
</table>