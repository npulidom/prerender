Prerender
=========

Lightweight Prerender container built on Alpine Linux with Node and Headless Chrome.

## Usage
```bash
docker run -p 3000:3000 npulidom/prerender
```

## Prerender plugins

A few default plugins have been activated by default:
- https://github.com/prerender/prerender/blob/master/lib/plugins/whitelist.js
- https://github.com/prerender/prerender/blob/master/lib/plugins/blacklist.js
- https://github.com/prerender/prerender/blob/master/lib/plugins/httpHeaders.js
- https://github.com/prerender/prerender/blob/master/lib/plugins/removeScriptTags.js