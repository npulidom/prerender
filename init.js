/**
 * Init
 */

const prerender = require('prerender')

const server = prerender({

	chromeFlags   : ['--no-sandbox', '--headless', '--disable-gpu', '--hide-scrollbars', '--disable-dev-shm-usage'],
	chromeLocation: '/usr/bin/chromium-browser',
	forwardHeaders: true
})

server.use(prerender.whitelist())
server.use(prerender.blacklist())
server.use(prerender.httpHeaders())
server.use(prerender.removeScriptTags())

/**
 * Init
 */
async function init() {

	/**
	 * Prerender server
	 */
	try       { await server.start() }
	catch (e) { console.error("Init -> server exception", e) }
}

init()
