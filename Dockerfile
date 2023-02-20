# OS
FROM node:18-alpine

# env vars
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CHROME_PATH=/usr/lib/chromium/

# allow "node" user to open port 80
RUN apk add libcap && setcap 'cap_net_bind_service=+ep' /usr/local/bin/node

# chromium install
RUN apk update && apk add \
	chromium \
	&& rm -rf /var/cache/apk/*

# home directory
WORKDIR /home/node/app

# copy node packages
COPY package.json .

# package lock file
RUN npm i --package-lock-only

# build id argument
ARG BUILD_ID
ENV BUILD_ID=$BUILD_ID

# ! development stage
FROM base AS dev

ENV NODE_ENV=development

# install nodemon & deps
RUN npm i -g nodemon && \
	npm ci --omit=dev && npm cache clean --force

# copy app
COPY . .

# switch user
USER node

# cmd
CMD ["nodemon", "init.js"]

# ! production stage
FROM base AS prod

ENV NODE_ENV=production

# install deps
RUN npm ci --omit=dev && npm cache clean --force

# copy app
COPY . .

# switch user
USER node

# cmd
CMD ["node", "init.js"]
