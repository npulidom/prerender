/**
 * Init
 */

import express        from 'express'
import prerender      from 'prerender'
import prerenderCache from 'prerender-memory-cache'
import got            from 'got'
import { URL }        from 'url'

/**
 * Service Version
 */
const version = process.env.BUILD_ID

/**
 * Service Server (express)
 */
const app = express()
// trust proxy
app.set('trust proxy', 1)
// disable X-Powered-By response header
app.disable('x-powered-by')

let httpServer

/**
 * Prerender Server (express)
 */
const prerenderServer = prerender({

	chromeFlags    : ['--no-sandbox', '--headless', '--disable-gpu', '--hide-scrollbars', '--disable-dev-shm-usage', '--remote-debugging-port=9222'],
	chromeLocation : '/usr/bin/chromium-browser',
	forwardHeaders : true,
	pageLoadTimeout: 45 * 1000 // 45 secs
})

// prerender plugins
if (process.env.ALLOWED_DOMAINS) prerenderServer.use(prerender.whitelist())

prerenderServer.use(prerender.httpHeaders())
prerenderServer.use(prerender.removeScriptTags())
// prerender cache
prerenderServer.use(prerenderCache)

/**
 * Init
 * @returns {undefined}
 */
async function init() {

	/**
	 * Health Check
	 */
	app.get('*/health', (req, res) => res.sendStatus(200))

	/**
	 * GET - Root
	 */
	app.get('*/', (req, res) => {

		try {

			if (!req.query.url) throw 'missing \'url\' query param'

			const { href } = new URL(req.query.url.trim())

			if (!href) throw 'invalid \'url\' query param'

			// trace execution time
			console.time(`prerender:${href}`)

			// get HTML
			const stream = got.stream(`http://localhost:3000/render?userAgent=PrerenderCrawler&url=${href}`)

			stream.on('error', e => console.warn(`Init (prerender) -> stream error: ${e.toString()}`))

			stream.on('data', data => res.write(data))

			stream.on('end', () => {

				console.timeEnd(`prerender:${href}`)
				res.status(200).send()
			})
		}
		catch (e) {

			console.error(`Init (prerender) -> exception: ${e.toString()}`)
			res.status(500).send(e.toString())
		}
	})

	// start server
	httpServer = await app.listen(80)

	// prerender
	await prerenderServer.start()

	console.log(`Init -> servers up! ${new Date().toString()}, version: ${version}`)
}

/**
 * Gracefull exit
 * @param {string} signal - The signal
 * @returns {undefined}
 */
async function exitGracefully(signal) {

	if (httpServer) await httpServer.close()

	console.log(`Init (exitGracefully) -> ${signal} signal event`)
	process.exit(0)
}

// process signal events
process.on('SIGINT', exitGracefully)
process.on('SIGTERM', exitGracefully)

// start app
try       { await init() }
catch (e) { console.error('Init -> main exception:', e) }
