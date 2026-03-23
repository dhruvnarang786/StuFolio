#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
npx tsc

# Install Chrome for Puppeteer
echo "Installing Chrome for Puppeteer..."
npx puppeteer browsers install chrome

# Ensure the cache directory exists and is linked if needed
mkdir -p /opt/render/.cache/puppeteer

# Verify the installation
echo "Verifying Puppeteer installation..."
ls -R /opt/render/.cache/puppeteer || echo "Cache directory not found or empty"
