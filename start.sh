#!/bin/sh
# docker-entrypoint

echo -e "Running container..."

# run with pm2 in dev mode
if [ "$APP_ENV" = "local" ]; then
	pm2-runtime init.js
# run without a process manager
else
	node init.js
fi
