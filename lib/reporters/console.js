function report(results) {
  results.forEach(function (result) {
    console.log('%s | %s - %s', result.status, result.uri, result.desc);
  });
}

exports.report = report;