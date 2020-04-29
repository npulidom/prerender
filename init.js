/**
 * Init
 */

const express   = require('express')
const got       = require('got')
const prerender = require('prerender')

const app = express()

const server = prerender({

	chromeFlags   : ['--no-sandbox', '--headless', '--disable-gpu', '--hide-scrollbars', '--disable-dev-shm-usage', '--remote-debugging-port=9222'],
	chromeLocation: '/usr/bin/chromium-browser',
	forwardHeaders: true
})

if (process.env.ALLOWED_DOMAINS)
	server.use(prerender.whitelist())

if (process.env.BLACKLISTED_DOMAINS)
	server.use(prerender.blacklist())

server.use(prerender.httpHeaders())
server.use(prerender.removeScriptTags())

/**
 * Init
 */
async function init() {

	// ++ Servers
	try {

		// prerender
		await server.start()

		// express
		await app.listen(80)

		console.log("Init -> servers ready")
	}
	catch (e) { return console.error("Init -> server exception", e) }

	/**
	 * GET - Health check
	 */
	app.get('*/health', (req, res) => res.sendStatus(200))

	/**
	 * GET - Root
	 */
	app.get("/", (req, res) => {

		if (!req.query.url) return res.send("Error: missing 'url' query parameter.")

		try {

			const stream = got.stream(`http://localhost:3000/render?url=${req.query.url.trim()}`)

			stream.on('data', data => res.write(data))
			stream.on('end', data => res.status(200).send())
			stream.on('error', e => res.status(200).send(e.toString()))
		}
		catch (e) { console.error("Init -> stream exception", e); res.sendStatus(500) }
	})

	/**
	 * GET - Not Found
	 */
	app.get('*', (req, res) => res.sendStatus(404))
}

init()
