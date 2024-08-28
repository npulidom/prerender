/**
 * Init
 */

import axios          from 'axios'
import express        from 'express'
import prerender      from 'prerender'
import prerenderCache from 'prerender-memory-cache'

/**
 * Version
 * @constant {string} VERSION - The build version
 */
const VERSION = process.env.BUILD_ID

/**
 * Health Check URL
 * @constant {string} HEALTH_CHECK_URL - The health check URL for service monitoring
 */
const HEALTH_CHECK_URL = process.env.HEALTH_CHECK_URL || 'https://www.example.com'

/**
 * Server
 * @property {object} server - The server instance
 */
let httpServer

/**
 * Prerender Server
 * @property {object} prerenderServer - The prerender server instance
 */
let prerenderServer

/**
 * Init
 * @returns {undefined}
 */
async function init() {

	// * prerender server (express)
	prerenderServer = prerender({

		chromeLocation: '/usr/bin/chromium',
		chromeFlags: [

			'--headless',
			'--hide-scrollbars',
			'--disable-gpu',
			'--no-sandbox',
			'--no-zygote',
			'--no-first-run',
			'--disable-setuid-sandbox',
			'--disable-dev-shm-usage',
			'--disable-web-security',
			'--ignore-certificate-errors',
			'--remote-debugging-port=9222',
		],
		pageLoadTimeout: parseInt(process.env.PAGE_LOAD_TIMEOUT) || undefined,
		forwardHeaders: true,
		logRequests: false,
		captureConsoleLog: false,
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
	 * Health Check Route
	 */
	app.get('*/health', (req, res) => res.sendStatus(200))

	/**
	 * GET - Root Route
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
				timeout     : 45 * 1000,
			})

			// on-error
			stream.on('error', e => {

				console.warn(`Init (prerender/on-error) -> stream error: ${e.toString()}`)
				throw 'STREAM_ERROR'
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
			await checkPrerenderServer()

			res.status(503).send()
		}
	})

	// * start express server
	httpServer = await app.listen(80)

	// * start prerender server
	await prerenderServer.start()

	console.log(`Init -> servers up at ${new Date().toString()}, version: ${VERSION}`)
}

/**
 * Check Prerender Server
 * @returns {undefined}
 */
async function checkPrerenderServer() {

	try {

		// check browser health, restart browser?
		const { status } = await axios({

			url    : `http://localhost:3000/render?userAgent=HealthCheckCrawler&url=${HEALTH_CHECK_URL}`,
			method : 'GET',
			timeout: 45 * 1000,
		})

		console.log(`Init (checkPrerenderServer) -> browser is healthy, no need to restart [${status}]`)
	}
	catch (e) {

		if (!prerenderServer) return

		console.log(`Init (checkPrerenderServer) -> browser is not healthy, restarting browser ...`)

		// * restart
		await prerenderServer.killBrowser()
		await prerenderServer.start()
	}
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
