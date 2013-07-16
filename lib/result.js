const SUCCESS = 'success',
  FAIL = 'fail',
  ERROR = 'error',
  WARNING = 'warning',
  COLORS = {
    success: 'green',
    fail: 'red',
    error: 'red',
    warning: 'yellow'
  };
  
function Result() {
  this.status = undefined;
  this.desc = undefined;
  this.uri = undefined;
  this.timestamp = undefined;
  this.duration = undefined;
  this.successes = [];
  this.failures = [];
  this.errors = [];
  this.info = {};
}

Result.prototype.success = function () {
  this.status = SUCCESS;
};

Result.prototype.fail = function () {
  this.status = FAIL;
};

Result.prototype.error = function () {
  this.status = ERROR;
};

Result.prototype.warning = function () {
  this.status = WARNING;
};

Result.prototype.setStatusByStats = function () {
  if (this.errors.length > 0) {
    this.status = ERROR;
  } else if (this.failures.length > 0) {
    this.status = FAIL;
  } else {
    this.status = SUCCESS;
  }
};

Result.prototype.getStatus = function () {
  return this.status;
};

Result.prototype.getStatusColor = function () {
  return COLORS[this.status];
};

Result.prototype.setName = function (name) {
  this.name = name;
};

Result.prototype.getName = function () {
  return this.name;
};

Result.prototype.setDescription = function (desc) {
  this.desc = desc;
};

Result.prototype.getDescription = function () {
  return this.desc;
};

Result.prototype.setUri = function (uri) {
  this.uri = uri;
};

Result.prototype.getUri = function () {
  return this.uri;
};

Result.prototype.setTimestamp = function (timestamp) {
  this.timestamp = timestamp;
};

Result.prototype.getTimestamp = function () {
  return this.timestamp;
};

Result.prototype.setDuration = function (duration) {
  this.duration = duration;
};

Result.prototype.getDuration = function () {
  return this.duration;
};

Result.prototype.isSuccess = function () {
  return this.status === SUCCESS;
};

Result.prototype.isFail = function () {
  return this.status === FAIL;
};

Result.prototype.isError = function () {
  return this.status === ERROR;
};

Result.prototype.isWarning = function () {
  return this.status === WARNING;
};

Result.prototype.getSuccesses = function () {
  return this.successes;
};

Result.prototype.getFailures = function () {
  return this.failures;
};

Result.prototype.getErrors = function () {
  return this.errors;
};

Result.prototype.getInfo = function () {
  return this.info;
};

Result.prototype.addSuccess = function (success) {
  this.successes.push(success);
};

Result.prototype.addFailure = function (failure) {
  this.failures.push(failure);
};

Result.prototype.addError = function (error) {
  this.errors.push(error);
};

Result.prototype.addInfo = function (type, info) {
  this.info[type] = info;
};

Result.prototype.addSuccesses = function (successes) {
  this.successes = this.successes.concat(successes);
};

Result.prototype.addFailures = function (failures) {
  this.failures = this.failures.concat(failures);
};

Result.prototype.addErrors = function (errors) {
  this.errors = this.errors.concat(errors);
};

Result.prototype.hasSuccess = function () {
  return this.successes.length > 0;
};

Result.prototype.hasFailure = function () {
  return this.failures.length > 0;
};

Result.prototype.hasError = function () {
  return this.errors.length > 0;
};

Result.prototype.hasInfo = function () {
  return Object.keys(this.info).length > 0;
};

module.exports = Result;
