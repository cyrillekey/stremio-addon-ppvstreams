#!/usr/bin/env node
import 'dotenv/config'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customParse from "dayjs/plugin/customParseFormat"

import { serveHTTP } from "stremio-addon-sdk"
import addonInterface from "./addon"
import * as Sentry from "@sentry/node"
import { nodeProfilingIntegration } from "@sentry/profiling-node"
import { buildDaddyLiveCatalog, fetchFootballFixturesCron,  fetchRapidEventsLink,  fetchRapidFootballEvents, FootballScheduleCronBuilder } from "cronjobs"
import dayjs from 'dayjs'
import { v2 as cloudinary } from "cloudinary"

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParse)
cloudinary.config({ api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, cloud_name: process.env.CLOUDINARY_CLOUD_NAME })


Sentry.init({
    dsn: "https://9e8a5e40a23ee3aba0e5f4321f2482c4@o4508483665330176.ingest.us.sentry.io/4508483668279296",
    integrations: [nodeProfilingIntegration()],

    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
})
buildDaddyLiveCatalog.start()
fetchFootballFixturesCron.start()
fetchRapidFootballEvents.start()
FootballScheduleCronBuilder.start()
fetchRapidEventsLink.start()
serveHTTP(addonInterface, { port: Number(process.env.PORT ?? 56397), cacheMaxAge: 60, static: "/public" })

// when you've deployed your addon, un-comment this line
// publishToCentral("https://my-addon.awesome/manifest.json")
// for more information on deploying, see: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/deploying/README.md
