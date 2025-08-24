#!/bin/sh
cd /app/packages/api && node dist/local-server.js &
cd /app/packages/web && npx serve -s dist -l 5173 &
wait
