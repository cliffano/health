
# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Set locale fallback to default when current locale is not defined

## [v0.3.0] - 2015-06-21

### Changed
- Set min node engine to >= v0.10.0

## [v0.2.3] - 2013-08-13

### Changed
- Improve mongo checker error message from mongodb dep

## [v0.2.2] - 2013-07-17

### Added
- Add result timestamp (when check is started)
- Add health#clearCache
- Add threshold support to resource group

### Changed
- Rename http(s) attributes: statusCodes -> statusCode, texts -> text
- All checker attributes handle <attribute> and <attribute>-or
- All checker attributes handle regular expression

## [v0.2.1] - 2013-06-27

### Added
- Add file checker

## [v0.2.0] - 2013-06-25

### Added
- Add result model

### Removed
- Remove xml formatter

## [v0.1.1] - 2013-06-17

### Added
- Add group check attribute
- Add headers and body as http(s) debug info

## [v0.1.0] - 2013-06-14

### Added
- Add error status to differentiate error from check failures
- Add success, failure, and error messages to improve reporting
- Add lenient check attribute and warning status

### Changed
- Rename responseTime to duration (check time in milliseconds)
- Change status ok to success

## [v0.0.5] - 2013-05-13

### Added
- Add cli formatter

## [v0.0.4] - 2013-05-12

### Added
- Add CLI with init and check commands

## [v0.0.3] - 2013-05-01

### Added
- Add html formatter 

## [v0.0.2] - 2013-05-01

### Changed
- Change status from OK/FAIL to ok/fail

## [v0.0.1] - 2013-04-30

### Added
- Initial version


