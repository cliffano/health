### 0.3.0-pre
* Set min node engine to >= v0.10.0

### 0.2.3
* Fix info icon display on html report when there's no info
* Improve mongo checker error message from mongodb dep

### 0.2.2
* Add result timestamp (when check is started)
* Rename http(s) attributes: statusCodes -> statusCode, texts -> text
* All checker attributes handle <attribute> and <attribute>-or
* Add health#clearCache
* All checker attributes handle regular expression
* Add threshold support to resource group

### 0.2.1
* Add file checker

### 0.2.0
* Add result model
* Remove xml formatter

### 0.1.1
* Add group check attribute
* Add headers and body as http(s) debug info
* Fix exit code when all checks are successful

### 0.1.0
* Add error status to differentiate error from check failures
* Add success, failure, and error messages to improve reporting
* Rename responseTime to duration (check time in milliseconds)
* Change status ok to success
* Add lenient check attribute and warning status

### 0.0.5
* Add cli formatter
* Fix CLI exit code to be the number of non-ok status

### 0.0.4
* Add CLI with init and check commands

### 0.0.3
* Add html formatter 

### 0.0.2
* Change status from OK/FAIL to ok/fail

### 0.0.1
* Initial version
