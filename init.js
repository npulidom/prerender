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

let httpServer

/**
 * Prerender Server (express)
 */
const prerenderServer = prerender({

	chromeFlags    : ['--no-sandbox', '--headless', '--disable-gpu', '--hide-scrollbars', '--disable-dev-shm-usage', '--remote-debugging-port=9222'],
	chromeLocation : '/usr/bin/chromium',
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

			const ts = new Date()

			// get HTML
			const stream = got.stream(`http://localhost:3000/render?userAgent=PrerenderCrawler&url=${href}`)

			stream.on('error', e => console.warn(`Init (prerender) -> stream error:`, e))

			stream.on('data', data => res.write(data))

			stream.on('end', () => {

				console.log(`Init (prerender) -> [${href}] time taken: ${Math.round((new Date() - ts)/1000)}s`)
				res.status(200).send()
			})
		}
		catch (e) {

			console.error(`Init (prerender) -> exception: ${e.toString()}`)

			// exit process
			if (parseInt(process.env.AUTOEXIT)) setTimeout(async () => await exitGracefully(), 1500)

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
