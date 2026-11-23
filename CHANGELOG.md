# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased
### Added
- Add YAML expectation files, each with a top-level `checks` array that can combine checks of any protocol
- Add http, https, http2, tcp, udp, dns, tls, websocket (ws), and ntp checkers built on Node.js core modules
- Add expectation matcher with partial deep matching and `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$contains`, `$matches`, `$exists`, `$in`, `$length`, `$type`, `$not` operators
- Add `Health#check`, `Health#checkFile`, and `Health#checkFiles` API
- Add `health check [--verbose] [file ...]` command, exit code 1 when any check fails
- Add example expectation file per protocol
- Add configuration reference doc per protocol under `docs/`
- Add test-integration suite exercising the `health` CLI

### Changed
- Change `health init` to create a sample `health.yaml` expectation file, without overwriting an existing one
- Change module type to ESM
- Replace test framework from buster-node to Mocha + Sinon + @sinonjs/referee
- Replace lint type from jshint to eslint, add Prettier style checking
- Replace coverage from buster-istanbul to c8
- Replace doc type from dox-foundation to jsdoc
- Replace Docker-based CI action with GH Actions (CI, CodeQL, publish, release-major/minor/patch, upgrade-deps)
- Add Suntory as build Makefile
- Add AGENTS.md with Node.js project conventions
- Set min node engine to >= 22.0.0

### Removed
- Remove JSON setup file and URI based resource definitions, superseded by YAML expectation files
- Remove file and mongodb checkers
- Remove cli, html, and text result formatters
- Remove result caching (`ttl`), resource groups, and `lenient` status
- Remove i18n locales

## 0.3.0 - 2015-06-21
### Changed
- Set min node engine to >= v0.10.0

## 0.2.3 - 2013-08-13
### Changed
- Improve mongo checker error message from mongodb dep

## 0.2.2 - 2013-07-17
### Added
- Add result timestamp (when check is started)
- Add health#clearCache
- Add threshold support to resource group

### Changed
- Rename http(s) attributes: statusCodes -> statusCode, texts -> text
- All checker attributes handle <attribute> and <attribute>-or
- All checker attributes handle regular expression

## 0.2.1 - 2013-06-27
### Added
- Add file checker

## 0.2.0 - 2013-06-25
### Added
- Add result model

### Removed
- Remove xml formatter

## 0.1.1 - 2013-06-17
### Added
- Add group check attribute
- Add headers and body as http(s) debug info

## 0.1.0 - 2013-06-14
### Added
- Add error status to differentiate error from check failures
- Add success, failure, and error messages to improve reporting
- Add lenient check attribute and warning status

### Changed
- Rename responseTime to duration (check time in milliseconds)
- Change status ok to success

## 0.0.5 - 2013-05-13
### Added
- Add cli formatter

## 0.0.4 - 2013-05-12
### Added
- Add CLI with init and check commands

## 0.0.3 - 2013-05-01
### Added
- Add html formatter

## 0.0.2 - 2013-05-01
### Changed
- Change status from OK/FAIL to ok/fail

## 0.0.1 - 2013-04-30
### Added
- Initial version
