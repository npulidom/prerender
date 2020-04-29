/**
 * Init
 */

const prerender = require('prerender')

const server = prerender({

	chromeFlags   : ['--no-sandbox', '--headless', '--disable-gpu', '--hide-scrollbars', '--disable-dev-shm-usage', '--remote-debugging-port=9222'],
	chromeLocation: '/usr/bin/chromium-browser',
	forwardHeaders: true
})

//server.use(prerender.blacklist())
server.use(prerender.whitelist())
server.use(prerender.httpHeaders())
server.use(prerender.removeScriptTags())

server.start()
