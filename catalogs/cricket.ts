import * as Sentry from "@sentry/node"
import axios from "axios"
import { IDaddyliveEvent } from "cronjobs/index"
import dayjs from "dayjs"
import { MetaDetail, MetaPreview, Stream } from "stremio-addon-sdk"
import { IRapidCricketEvent } from "types"
import { getFromCache, saveToCache } from "utils/redis"
export const cricketCatalogBuilder = async ({ timeZone,search }: { timeZone?: string , search?: string }): Promise<MetaPreview[]> => {
    try {
        const now = dayjs.tz(dayjs().utc(), timeZone).unix()
        const thirtyMinutes = dayjs.tz(dayjs().utc(), timeZone).add(45, 'minutes').unix()
        const cacheExist = await getFromCache('catalog')
        if (!cacheExist) {
            return []
        } else {
            const matches = cacheExist as IDaddyliveEvent[]
            const filtered = matches.filter((a) => {
                if (a.type == "cricket") {
                    const startsAtMs = dayjs.unix(a.time).tz(timeZone).unix()                    
                    if ((startsAtMs <= now) || (startsAtMs > now && startsAtMs <= thirtyMinutes)) {
                        return true
                    }
                    return false
                }
            })
                .map((a) => (<MetaPreview>{
                    name: a.name,
                    type: "tv",
                    description: a.name,
                    logo: a.poster ?? "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.AuYX7CjYL6ge20L2Zd7nQAHaHa%26pid%3DApi&f=1&ipt=41d97734a05f562df01a485180fa285fb0cc26191aa8fa1cda8041e8591e1aae&ipo=images",
                    id: a.id,
                    poster: a?.poster ?? "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fthumbs.dreamstime.com%2Fb%2Flive-cricket-tournament-poster-banner-design-game-equipments-glossy-blue-background-live-cricket-tournament-poster-135206032.jpg&f=1&nofb=1&ipt=8d940ce9afaad7d99d2cecf5c7cb85a6f02bcd8cccd67cb5678d3008a4f43fa8&ipo=images",
                    posterShape: "landscape",
                }))

            if (search) {
                return filtered.filter((a) => a.name.match(RegExp(search, 'gi')))
            }
            return filtered
        }

    } catch (error) {        
        Sentry.captureException(error)
        return []
    }
}

export const cricketMetaBuilder = async (id: string,): Promise<MetaDetail> => {
    try {
        const stream = (await cricketCatalogBuilder({})).find((a) => a.id == id)
        if (stream) {
            return {
                id,
                name: stream.name,
                description: stream.name,
                type: "tv",
                poster: stream.poster,
                posterShape: stream.posterShape,
                country: 'UK',
                language: "English",
                logo: stream.logo,
            }
        } return {
            id: id,
            name: "N/A",
            description: "N/A",
            type: "tv",
        }
    } catch (error) {
        Sentry.captureException(error)
        return {
            id: id,
            name: "N/A",
            description: "N/A",
            type: "tv",
        }
    }
}

export const cricketStreamsBuilder = async (id: string): Promise<Stream[]> => {
    try {
        const cacheExist = await getFromCache('catalog')
        if (!cacheExist) {
            return []
        } else {
            const matches = cacheExist as IDaddyliveEvent[]
            const filtered = matches.find((a) => a.id == id)
            if (filtered) {
                return filtered.streams!
            }
            return []
        }
    } catch (error) {
        Sentry.captureException(error)
        return []
    }
}

export const cricketRapidApiSchedule = async (): Promise<IRapidCricketEvent[]> => {
    try {
        // check if exist in cache
        const exists = await getFromCache('rapid-cricket')
        if (exists) {
            return exists
        } else {
            const options = {
                method: 'GET',
                url: 'https://cricket-live-line1.p.rapidapi.com/upcomingMatches',
                headers: {
                    'x-rapidapi-key': process.env.RAPID_CRICKET_API_KEY,
                    'x-rapidapi-host': 'cricket-live-line1.p.rapidapi.com'
                }
            };
            const response = await axios.request(options);
            const events = (response.data?.data);
            saveToCache('rapid-cricket', JSON.stringify(events), 60 * 60 * 18)
            return events
        }
    } catch (error) {
        Sentry.captureException(error)
        return []
    }
}