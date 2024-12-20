/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Sentry from "@sentry/node"
import axios from "axios";
import dayjs from "dayjs";
import { FootballHighlightEvent, IPPLandStreamDetails, RapidApiLiveFootballEvent } from "types";
import { getFromCache, saveToCache } from "utils/redis";
import { Stream as StremioStream } from "stremio-addon-sdk";
interface DaddyliveStream {
    id: string;
    type: string;
    name: string;
    timestamp: number;
    logo: string;
    poster: string;
    genres: string[];
    streams: Stream[];
}

interface Stream {
    url: string;
    name: string;
    description: string;
    behaviorHints: BehaviorHints;
}

interface BehaviorHints {
    notWebReady: boolean;
}

export interface DaddyliveSchedule {
    type: string
    date: number
    name: string
    channels: string[]
}

export const fetchWorldWideSportStreams = async (): Promise<DaddyliveStream[]> => {
    try {
        // check if currently exists in cache
        const cache = await getFromCache('worldwide-events')
        if (cache) {
            return cache
        } else {
            const request = await fetch('https://848b3516657c-worldwide-sports-tv.baby-beamup.club/catalog/tv/tv.json');
            const response = await request.json()
            const metas = (response['metas'] ?? [])?.filter((a: any) => a.genres.includes('UK') || a.genres.includes('USA'))
            saveToCache('worldwide-events', JSON.stringify(metas), 24 * 60 * 60)
            return metas
        }
    } catch (error) {
        Sentry.captureException(error)
        return []
    }
}

export const fetchDaddyliveSchedule = async (): Promise<DaddyliveSchedule[]> => {
    try {
        const request = await fetch('https://thedaddy.to/schedule/schedule-generated.json')
        const response = await request.json() as Record<string, Record<string, any[]>>
        const events: DaddyliveSchedule[] = []
        for (const [key, value] of Object.entries(response)) {
            const dateParts = key.split("-")[0].trim()
            const parts = dateParts.split(" ")
            const year = parts?.at(-1)
            const month = parts?.at(-2)
            const day = parts?.at(1)?.slice(0, 2)
            const date = dayjs(`${day} ${month} ${year}`)
            const ukDateTime = `${year}-${date.format('MM')}-${day}T`;
            const ukTimezone = "Europe/London";
            for (const [showKey, showValue] of Object.entries(value)) {
                const type = showKey.trim().replace(/ /gi, "-").toLowerCase()
                for (let index = 0; index < showValue.length; index++) {
                    const event = showValue[index]
                    const kenyaUnixTime = dayjs.tz(`${ukDateTime}${event['time']}:00`, ukTimezone).utc().unix()
                    events.push({ type, date: kenyaUnixTime, name: event.event, channels: Array.isArray(event.channels) ? event.channels?.map((a: any) => a.channel_name) : Object.values(event.channels)?.map((a: any) => a.channel_name) })
                }
            }
        }
        return events
    } catch (error) {
        Sentry.captureException(error)
        return []
    }
}
// fetch football higlight events

export const fetchFootballHighlightEvents = async (): Promise<FootballHighlightEvent[]> => {
    try {
        const events: FootballHighlightEvent[] = []
        for (let index = 0; index < 10; index++) {
            const games = await eventFetcher(index * 100)
            if (games.length > 0) {
                events.push(...games)
                await new Promise((resolve) => setTimeout(resolve, 1000))
            } else {
                break
            }
        }
        return events
    } catch (error) {
        Sentry.captureException(error)
        return []
    }

}

const eventFetcher = async (offset: number): Promise<FootballHighlightEvent[]> => {
    try {
        const options = {
            method: 'GET',
            url: 'https://football-highlights-api.p.rapidapi.com/matches',
            params: {
                date: dayjs().format('YYYY-MM-DD'),
                timezone: 'Africa/Nairobi',
                offset
            },
            headers: {
                'x-rapidapi-key': process.env.RAPID_FOOTBALL_HIGHLIGHTS_API,
                'x-rapidapi-host': 'football-highlights-api.p.rapidapi.com'
            }
        };
        const response = await axios.request(options);
        return response?.data?.data
    } catch (error) {
        Sentry.captureException(error)
        return []
    }
}

export const fetchfootballLiveStreamEvents = async (): Promise<RapidApiLiveFootballEvent[]> => {
    try {        
        
        const events: RapidApiLiveFootballEvent[] = (await axios.request({
            method: 'GET',
            url: 'https://football-live-stream-api.p.rapidapi.com/all-match',
            headers: {                
                'x-rapidapi-key':process.env.RAPID_LIVE_FOOTBALL_API!,
                'x-rapidapi-host': 'football-live-stream-api.p.rapidapi.com'
            }
        })).data['result'] ?? []                
        return events
    } catch (error) {
        Sentry.captureException(error)
        return []
    }
}

export const fetchRapidFootballeventLink = async (id: string,apiKey: string): Promise<string | null> => {
    try {
        const repsonse = (await axios.request({
            method: 'GET',
            url: `https://football-live-stream-api.p.rapidapi.com/link/${id}`,
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': 'football-live-stream-api.p.rapidapi.com'
            }
        }))        
        const link = repsonse.data['url']
        if (link == "") {
            return null
        }
        return link
    } catch (error) {        
        Sentry.captureException(error)
        return null
    }
}


export async function getPPvLandStreams(id: string): Promise<StremioStream[]> {
    try {
        const transaction = Sentry.startSpanManual({ name: `Get ${id} streams link`, op: "http:server" }, (span) => span)
        const streams = await fetch(`https://ppv.land/api/streams/${id}`)
        const response: IPPLandStreamDetails = await streams.json()
        transaction.end()
        return [
            {
                name: response?.data?.name ?? "N/A",
                url: response?.data?.source ?? "N/A",
                title: response?.data?.tag ?? "N/A",
                behaviorHints: { notWebReady: true, },
            },
        ]
    } catch (error) {
        Sentry.captureException(error)
        return []
    }
}