Prerender
=========

Container service that uses Headless Chrome to render SPA's as HTML ([Dynamic Rendering](https://developers.google.com/search/docs/guides/dynamic-rendering)), built on NodeJs.

## Usage

```bash
docker run -p 8080:80 npulidom/prerender
# test
curl -i http://localhost:8080/?url=https://www.example.com

```

## Env vars
```yml
ALLOWED_DOMAINS: Allowed hosts (i.e. www.example.com)
CACHE_MAXSIZE: Maximum number of items in the cache, default is 100
CACHE_TTL: Time to live for items in the cache, default is 60 seconds
```

## Prerender plugins

Some plugins have been activated by default:

- https://github.com/prerender/prerender/blob/master/lib/plugins/whitelist.js
- https://github.com/prerender/prerender/blob/master/lib/plugins/blacklist.js
- https://github.com/prerender/prerender/blob/master/lib/plugins/httpHeaders.js
- https://github.com/prerender/prerender/blob/master/lib/plugins/removeScriptTags.js

## Prerender documentation

https://github.com/prerender/prerender
