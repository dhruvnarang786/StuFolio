#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
npx tsc

# Install Chrome for Puppeteer
echo "Installing Chrome for Puppeteer..."
npx puppeteer browsers install chrome

# Install Chrome for Puppeteer to a project-local directory
echo "Installing Chrome for Puppeteer..."
PUPPETEER_CACHE_DIR=./.puppeteer-cache npx puppeteer browsers install chrome

# Verify the installation
echo "Verifying Puppeteer installation..."
ls -R ./.puppeteer-cache || echo "Local cache directory not found or empty"
