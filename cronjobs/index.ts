
import { fetchDaddyliveSchedule, fetchFootballHighlightEvents, fetchfootballLiveStreamEvents, fetchRapidFootballeventLink, fetchWorldWideSportStreams, getPPvLandStreams } from "api/streams"
import { CronJob } from "cron"
import { getFromCache, saveToCache } from "utils/redis"
import { Stream } from "stremio-addon-sdk"
import { compareDaddyliveStreams } from "utils/index"
import { cricketRapidApiSchedule } from "catalogs/cricket"
import { createEventPoster, createFootbalPoster } from "utils/poster"
import dayjs from "dayjs"
import * as Sentry from "@sentry/node"
import { IFootballEventCatalog } from "types"
import { getPpvLandFootballEvents } from "catalogs/football"
import similarity from "similarity"
import { PrismaClient } from "@prisma/client"

export const prismaClient = new PrismaClient()
export interface IDaddyliveEvent {
    id: string
    time: number
    name: string
    streams: Stream[]
    type: string
    description: string
    poster?: string
}

export interface IFootballEvent {
    id: string
    name: string
    homeTeam: string
    awayTeam: string
    league: string
    time: number
    poster?: string
    logo?: string
}

const DaddyliveCronjob = Sentry.cron.instrumentCron(CronJob, "daddyliveCronjobs")
export const buildDaddyLiveCatalog = new DaddyliveCronjob("0 1,8,16,20 * * *", async () => {
    try {
        const channels = await fetchWorldWideSportStreams()
        const events = (await fetchDaddyliveSchedule())
        const cricket = await cricketRapidApiSchedule()
        const filtered = await events.reduce(async (totalEvents: Promise<IDaddyliveEvent[]>, current) => {
            const total = await totalEvents
            try {
                // world wide channels is channels
                // current event channels == current.channels
                const exists = channels.filter((a) => compareDaddyliveStreams(a.name, current.channels))

                if (exists?.length > 0) {
                    if (current.type == "cricket") {
                        const awayTeam = (current.name.split("vs")?.at(-1)?.trim())
                        if (awayTeam) {
                            const regEx = RegExp(awayTeam, 'gi')
                            const fixture = cricket.find((a) => a.team_a.match(regEx) || a.team_b.match(regEx))
                            if (fixture) {
                                const poster = await createEventPoster(fixture.team_a_img, fixture.team_b_img)
                                total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: current.name, description: current.name, type: current.type, streams: exists.map((a) => a.streams.map((b) => ({ ...b, name: a.name }))).flat(), time: current.date, poster })
                            } else total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: current.name, description: current.name, type: current.type, streams: exists.map((a) => a.streams.map((b) => ({ ...b, name: a.name }))).flat(), time: current.date })
                        } else total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: current.name, description: current.name, type: current.type, streams: exists.map((a) => a.streams.map((b) => ({ ...b, name: a.name }))).flat(), time: current.date })
                    } else if (current.type == "soccer") {
                        const [league, teams] = current.name.split(" : ")
                        const [homeTeam, awayTeam] = teams.split("vs")
                        const name = `${league}: ${homeTeam?.trim()} vs ${awayTeam?.trim()}`
                        total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: name, description: current.name, type: "football", streams: exists.map((a) => a.streams.map((b) => ({ ...b, name: a.name }))).flat(), time: current.date })
                    } else total.push({ id: `wwtv-${current.name.replace(/ /gi, "-").toLowerCase()}`, name: current.name, description: current.name, type: current.type, streams: exists.map((a) => a.streams.map((b) => ({ ...b, name: a.name }))).flat(), time: current.date })
                }
                return total
            } catch (error) {
                Sentry.captureException(error)
                return total
            }
        }, Promise.resolve([]))
        saveToCache('catalog', JSON.stringify(filtered), 12 * 60 * 60)
    } catch (error) {
        Sentry.captureException(error)
    }
})

const FetchFixturesCron = Sentry.cron.instrumentCron(CronJob, "fetchFixtureCronjob")
export const fetchFootballFixturesCron = new FetchFixturesCron("00 05 * * *", async () => {
    try {
        const footballEvents = await fetchFootballHighlightEvents()
        const events = await footballEvents.reduce(async (all: Promise<IFootballEvent[]>, current) => {
            const total = await all
            const poster = await createFootbalPoster({
                homeTeam: current.homeTeam.logo ?? "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%3Fid%3DOIP.J7c3mMFEqPKkJdxMXNjAqwHaHa%26pid%3DApi&f=1&ipt=e85dcca1a0889f6198b1c6e98144bb1147b4dbe8371c2d4b9d110b53be47a2bd&ipo=images",
                awayTeam: current?.awayTeam?.logo ?? "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%3Fid%3DOIP.J7c3mMFEqPKkJdxMXNjAqwHaHa%26pid%3DApi&f=1&ipt=e85dcca1a0889f6198b1c6e98144bb1147b4dbe8371c2d4b9d110b53be47a2bd&ipo=images",
                league: current?.league?.logo ?? "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%3Fid%3DOIP.J7c3mMFEqPKkJdxMXNjAqwHaHa%26pid%3DApi&f=1&ipt=e85dcca1a0889f6198b1c6e98144bb1147b4dbe8371c2d4b9d110b53be47a2bd&ipo=images"
            })
            total.push({ awayTeam: current.awayTeam.name ?? "Away team", homeTeam: current.homeTeam.name ?? "Home team", poster, id: current.id.toString(), league: current?.league?.name ?? "League", name: `${current?.homeTeam?.name} vs ${current?.awayTeam?.name}`, time: dayjs.tz(current.date).utc(true).unix(), logo: current.league.logo ?? "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse4.mm.bing.net%2Fth%3Fid%3DOIP.J7c3mMFEqPKkJdxMXNjAqwHaHa%26pid%3DApi&f=1&ipt=e85dcca1a0889f6198b1c6e98144bb1147b4dbe8371c2d4b9d110b53be47a2bd&ipo=images" })
            return total
        }, Promise.resolve([]))
        await saveToCache('football-highlight-events', JSON.stringify(events), 26 * 60 * 60)
    } catch (error) {
        Sentry.captureException(error)
    }
})


const EventsApiCronWithCheckIn = Sentry.cron.instrumentCron(CronJob, "fetchRapidFootballEvents")
export const fetchRapidFootballEvents = new EventsApiCronWithCheckIn("*/28 * * * *", async () => {
    try {
        await prismaClient.$connect()
        const events = await fetchfootballLiveStreamEvents()
        for (let index = 0; index < events.length; index++) {
            const a = events[index]
            const [day, month, year] = a.date.split("/")
            const date = dayjs.tz(`${year}-${month}-${day} ${a.time}`, 'Asia/Yangon').utc().unix()
            // check if event exist
            const event = await prismaClient.rapidFootballCatalogue.findUnique({
                where: {
                    eventId: a.id
                }
            })
            // if event exists update
            if (event) {
                if (!event.link && a.status == "Live") {
                    const url = await fetchRapidFootballeventLink(event.id, process.env.RAPID_LIVE_FOOTBALL_API_3!)
                    if (url && url != "") {
                        await prismaClient.rapidFootballCatalogue.update({
                            where: {
                                id: event.id
                            },
                            data: {
                                link: url
                            }
                        })
                    }
                }
            } else {
                await prismaClient.rapidFootballCatalogue.create({
                    data: { awayTeam: a.away_name, eventId: a.id, homeTeam: a.home_name, name: `${a.home_name} vs ${a.away_name}`, status: a.status, date: date },
                })
            }
        }

        await prismaClient.$disconnect()
    } catch (error) {
        Sentry.captureException(error)
    }
})

const FetchRapidEventCron = Sentry.cron.instrumentCron(CronJob, "FetchRapidEventLinkCron")
export const fetchRapidEventsLink = new FetchRapidEventCron("*/15 * * * *", async () => {
    try {
        await prismaClient.$connect()
        const currentTime = dayjs().utc().unix()
        const events = await prismaClient.rapidFootballCatalogue.findMany({
            where: {
                link: {
                    isSet: false
                },
            },

        })
        const missingLinks = events.filter((event) => {
            const endTime = dayjs.unix(event.date).add(145, 'minutes').utc().unix()
            // check event has not ended
            if (currentTime > endTime) {
                return false
            } else {
                // check event has started
                if (currentTime >= event.date || currentTime >= dayjs.unix(event.date).utc().unix()) {
                    return true
                } else return false
            }
        })
        for (let index = 0; index < missingLinks.length; index++) {
            const link = await fetchRapidFootballeventLink(missingLinks[index].eventId, process.env.RAPID_LIVE_FOOTBALL_API_2!)
            if (link != null && link != "")
                await prismaClient.rapidFootballCatalogue.update({
                    where: {
                        eventId: missingLinks[index].eventId
                    }, data: { link }
                })
        }
        await prismaClient.$disconnect()
    } catch (error) {
        Sentry.captureException(error)
    }
})

const FixtureScheduleCron = Sentry.cron.instrumentCron(CronJob, "footballScheduleCronjob")
export const FootballScheduleCronBuilder = new FixtureScheduleCron("*/10 * * * *", async () => {
    try {
        const currentTime = dayjs().utc().unix()
        await prismaClient.$connect()
        const daddyLiveEvent: IDaddyliveEvent[] = ((await getFromCache('catalog')) as IDaddyliveEvent[]).filter((a) => a.type == "football" || a.type == "soccer")
        const footballHighlightEvents: IFootballEvent[] = await getFromCache('football-highlight-events') ?? []
        const rapidApiEvents = (await prismaClient.rapidFootballCatalogue.findMany({
            where: {
                link: {
                    isSet: true
                }
            }
        })).filter((event) => {
            const endTime = dayjs.unix(event.date).add(145, 'minutes').utc().unix()
            // check event has not ended
            if (currentTime > endTime) {
                return false
            } else {
                // check event has started
                if (currentTime >= event.date || currentTime >= dayjs.unix(event.date).utc().unix()) {
                    return true
                } else return false
            }
        })
        const ppvLandFootballFixture = await getPpvLandFootballEvents({})

        const footballEvents = await footballHighlightEvents.reduce(async (promise: Promise<IFootballEventCatalog[]>, current) => {
            // daddylive streams
            const total = await promise
            const daddyliveStreams = daddyLiveEvent.find((a) => {
                const teams = a.name.split(":")?.at(-1)
                const [homeTeam, awayTeam] = teams!.split("vs")
                return (similarity(current.homeTeam.trim(), homeTeam?.trim()) > 0.9) || (similarity(current.awayTeam?.trim(), awayTeam?.trim()) > 0.9)
            })?.streams ?? []
            // ppv land exits
            const streams: Stream[] = []
            const existsPvvLand = ppvLandFootballFixture.find((a) => {
                const teams = a.name.split(":")?.at(-1)
                const [homeTeam, awayTeam] = teams!.split("vs")
                return (similarity(current.homeTeam.trim(), homeTeam.trim()) > 0.9) || (similarity(current.awayTeam.trim(), awayTeam.trim()) > 0.9)
            })
            if (existsPvvLand) {
                const stream = await getPPvLandStreams(existsPvvLand.id)
                streams.push(...stream)
            }
            const rapidStreams = rapidApiEvents.find((a) => {
                return similarity(a.homeTeam?.trim(), current.homeTeam?.trim()) > 0.8 || similarity(a.awayTeam?.trim(), current.awayTeam?.trim()) > 0.8
            })
            if (daddyliveStreams != null && daddyliveStreams?.length > 0) {
                streams.push(...daddyliveStreams)
            }
            if (rapidStreams) {
                streams.push({ name: current.name, externalUrl: rapidStreams.link!, title: "SD", url: rapidStreams.link!, behaviorHints: { notWebReady: true } })
            }
            if (streams.length > 0) {
                const event: IFootballEventCatalog = {
                    id: `${current.id}-football`,
                    time: current.time,
                    name: current.name,
                    description: current.name,
                    poster: current.poster!,
                    streams
                }
                total.push(event)
            }
            return total
        }, Promise.resolve([]))
        saveToCache('football-catalog', JSON.stringify(footballEvents), 12 * 60 * 60)
    } catch (error) {
        Sentry.captureException(error)
    }
    // for each event reduce and build catalog
})
