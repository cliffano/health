#!/usr/bin/env bash
set -o errexit
set -o nounset

# Verify the sample expectation file created by `health init`.
../bin/health.js check health.yaml

# Verify several expectation files at once, with full captured results.
../bin/health.js check --verbose http.yaml dns.yaml tls.yaml
