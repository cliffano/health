"use strict";

const SUCCESS = "success";
const FAIL = "fail";
const ERROR = "error";
const WARNING = "warning";
const COLORS = {
  success: "green",
  fail: "red",
  error: "red",
  warning: "yellow",
};

/**
 * class Result
 * Represents the outcome of a single resource health check.
 */
class Result {
  constructor() {
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

  success() {
    this.status = SUCCESS;
  }

  fail() {
    this.status = FAIL;
  }

  error() {
    this.status = ERROR;
  }

  warning() {
    this.status = WARNING;
  }

  setStatusByStats() {
    if (this.errors.length > 0) {
      this.status = ERROR;
    } else if (this.failures.length > 0) {
      this.status = FAIL;
    } else {
      this.status = SUCCESS;
    }
  }

  getStatus() {
    return this.status;
  }

  getStatusColor() {
    return COLORS[this.status];
  }

  setName(name) {
    this.name = name;
  }

  getName() {
    return this.name;
  }

  setDescription(desc) {
    this.desc = desc;
  }

  getDescription() {
    return this.desc;
  }

  setUri(uri) {
    this.uri = uri;
  }

  getUri() {
    return this.uri;
  }

  setTimestamp(timestamp) {
    this.timestamp = timestamp;
  }

  getTimestamp() {
    return this.timestamp;
  }

  setDuration(duration) {
    this.duration = duration;
  }

  getDuration() {
    return this.duration;
  }

  isSuccess() {
    return this.status === SUCCESS;
  }

  isFail() {
    return this.status === FAIL;
  }

  isError() {
    return this.status === ERROR;
  }

  isWarning() {
    return this.status === WARNING;
  }

  getSuccesses() {
    return this.successes;
  }

  getFailures() {
    return this.failures;
  }

  getErrors() {
    return this.errors;
  }

  getInfo() {
    return this.info;
  }

  addSuccess(success) {
    this.successes.push(success);
  }

  addFailure(failure) {
    this.failures.push(failure);
  }

  addError(error) {
    this.errors.push(error);
  }

  addInfo(type, info) {
    this.info[type] = info;
  }

  addSuccesses(successes) {
    this.successes = this.successes.concat(successes);
  }

  addFailures(failures) {
    this.failures = this.failures.concat(failures);
  }

  addErrors(errors) {
    this.errors = this.errors.concat(errors);
  }

  hasSuccess() {
    return this.successes.length > 0;
  }

  hasFailure() {
    return this.failures.length > 0;
  }

  hasError() {
    return this.errors.length > 0;
  }

  hasInfo() {
    return Object.keys(this.info).length > 0;
  }
}

export { Result as default };
