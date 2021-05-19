# OS
FROM node:14-alpine

# env vars
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CHROME_PATH=/usr/lib/chromium/

# chromium install
RUN apk update && apk add \
	chromium \
	&& rm -rf /var/cache/apk/*

# home directory
WORKDIR /home

# node packages
COPY package.json .
RUN npm install -g pm2 && \
	npm install --production --no-package-lock

# copy app
COPY . .

# service port
EXPOSE 80

# entrypoint
ENTRYPOINT ["/home/start.sh"]
