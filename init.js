/**
 * Init
 */

const express   = require('express')
const got       = require('got')
const prerender = require('prerender')
const { URL }   = require('url')

const app = express()

//++ Prerender setup
const server = prerender({

	chromeFlags   : ['--no-sandbox', '--headless', '--disable-gpu', '--hide-scrollbars', '--disable-dev-shm-usage', '--remote-debugging-port=9222'],
	chromeLocation: '/usr/bin/chromium-browser',
	forwardHeaders: true,
	pageLoadTimeout: 35*1000 // 35 secs
})

//++ plugins

if (process.env.ALLOWED_DOMAINS)
	server.use(prerender.whitelist())

server.use(prerender.httpHeaders())
server.use(prerender.removeScriptTags())

// prerender cache
server.use(require('prerender-memory-cache'))

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
	app.get('*/', (req, res) => {

		try {

			if (!req.query.url) throw "Missing 'url' query param"

			const { href } = new URL(req.query.url.trim())

			if (!href) throw "invalid 'url' query param"

			const stream = got.stream(`http://localhost:3000/render?url=${href}&userAgent=PrerenderCrawler`)

			stream.on('data', data => res.write(data))
			stream.on('end', () => res.status(200).send())
			stream.on('error', e => console.warn(`stream error '${e.toString()}'`))
		}
		catch (e) {

			console.error("Init -> exception", e)

			// exit process
			if (process.env.AUTOEXIT) setTimeout(() => exit(), 1000)

			res.status(400).send(e.toString())
		}
	})

	/**
	 * Not Found
	 */
	app.use((req, res, next) => res.sendStatus(404))
}

/**
 * Exit Process
 */
function exit() {

	console.warn("Init -> ending process...")
	// exit process
	process.exit(0)
}

init()
