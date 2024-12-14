#!/usr/bin/env node
import 'module-alias/register'
import 'dotenv/config'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

import { serveHTTP } from "stremio-addon-sdk"
import addonInterface from "./addon"
import * as Sentry from "@sentry/node"
import { nodeProfilingIntegration } from "@sentry/profiling-node"
import { buildCatalogCron } from "cronjobs"
import dayjs from 'dayjs'
import { v2 as cloudinary } from "cloudinary"


dayjs.extend(utc)
dayjs.extend(timezone)
cloudinary.config({ api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, cloud_name: process.env.CLOUDINARY_CLOUD_NAME })

Sentry.init({
    dsn: "https://2faaad8d19ae0928c559d1ff0e81f093@o4504167984136192.ingest.us.sentry.io/4508274805374976",
    integrations: [nodeProfilingIntegration()],

    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
})
buildCatalogCron.start()
serveHTTP(addonInterface, { port: Number(process.env.PORT ?? 56397), cacheMaxAge: 60, })

// when you've deployed your addon, un-comment this line
// publishToCentral("https://my-addon.awesome/manifest.json")
// for more information on deploying, see: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/deploying/README.md
