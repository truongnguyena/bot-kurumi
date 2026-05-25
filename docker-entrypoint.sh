#!/bin/sh
set -e
cd /app
node scripts/prepare-deploy.js
node scripts/fly-health.js &
exec npm start
