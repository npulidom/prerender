/**
 * Init
 */

import axios          from 'axios'
import express        from 'express'
import prerender      from 'prerender'
import prerenderCache from 'prerender-memory-cache'

// * consts
const VERSION = process.env.BUILD_ID

const HEALTH_CHECK_URL = 'https://www.example.com/'

// * props
let httpServer

/**
 * Init
 * @returns {undefined}
 */
async function init() {

	// * prerender server (express)
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

	// * express setup
	const app = express()
	// trust proxy
	app.set('trust proxy', 1)
	// disable X-Powered-By response header
	app.disable('x-powered-by')

	/**
	 * Health Check
	 */
	app.get('*/health', (req, res) => res.sendStatus(200))

	/**
	 * GET - Root
	 */
	app.get('*/', async (req, res) => {

		try {

			if (!req.query.url) throw 'missing “url” query param'

			const { href, pathname } = new URL(req.query.url.trim())
			if (!href) throw 'invalid “url” query param'

			// check URL path for any extension (only HTML files supported)
			const extension = pathname.match(/.*\.[^.]+$/)
			if (extension?.length && !/\.html$/.test(pathname)) throw 'URL_NOT_SUPPORTED'

			// trace execution time
			if (process.env.NODE_ENV === 'development') console.time(`prerender:${href}`)

			// get output
			const { data: stream } = await axios({

				url         : `http://localhost:3000/render?userAgent=PrerenderCrawler&followRedirects=true&url=${href}`,
				method      : 'GET',
				responseType: 'stream',
			})

			// on-error
			stream.on('error', async e => {

				console.warn(`Init (prerender/on-error) -> stream error: ${e.toString()}`)

				try {

					// check browser health, restart browser?
					const { status } = await axios(`http://localhost:3000/render?url=${HEALTH_CHECK_URL}`)
					console.log(`Init (prerender/on-error) -> browser is healthy, no need to restart [${status}]`)
				}
				catch (e) {

					console.log(`Init (prerender/on-error) -> browser is not healthy, restarting browser ...`)
					prerenderServer.restartBrowser()
				}

				res.status(429).send()
			})

			// on-data
			stream.on('data', data => res.write(data))
			// on-end
			stream.on('end', () => {

				// trace execution time
				if (process.env.NODE_ENV === 'development') console.timeEnd(`prerender:${href}`)

				res.status(200).send()
			})
		}
		catch (e) {

			console.error(`Init (prerender) -> exception: ${e.toString()}`)
			res.status(500).send(e.toString())
		}
	})

	// * start express server
	httpServer = await app.listen(80)

	// * start prerender server
	await prerenderServer.start()

	console.log(`Init -> servers up at ${new Date().toString()}, version: ${VERSION}`)
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
try { await init() }
catch (e) { console.error('Init -> main exception:', e) }
