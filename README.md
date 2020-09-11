Prerender
=========

Container service that uses Headless Chrome to render SPA's as HTML ([Dynamic Rendering](https://developers.google.com/search/docs/guides/dynamic-rendering)), built on Alpine Linux.

## Usage

```bash
docker run -p 8080:80 npulidom/prerender

# test
curl http://localhost:8080/\?url\=https://www.example.com

```

## Prerender plugins

Some plugins have been activated by default:

- https://github.com/prerender/prerender/blob/master/lib/plugins/whitelist.js
- https://github.com/prerender/prerender/blob/master/lib/plugins/blacklist.js
- https://github.com/prerender/prerender/blob/master/lib/plugins/httpHeaders.js
- https://github.com/prerender/prerender/blob/master/lib/plugins/removeScriptTags.js

## Prerender documentation

https://github.com/prerender/prerender
