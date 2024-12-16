import * as Sentry from "@sentry/node"
import dayjs from "dayjs";
import { MetaDetail, MetaPreview, Stream } from "stremio-addon-sdk";
import { IFootballEventCatalog, IPPVLandStream } from "types";
import { getFromCache } from "utils/redis";
// get ppv land footballEvents

export const getPpvLandFootballEvents = async ({ search }: { search?: string }): Promise<MetaPreview[]> => {
    const transaction = Sentry.startSpanManual({ name: `Get football catalogue`, op: "http.server" }, (span) => span)
    const matches = await fetch('https://ppv.land/api/streams')
    const response = await matches.json()
    const results: IPPVLandStream[] = response.streams ?? []
    const live = results
        .filter(a => a.category.toLowerCase().replace(/ /gi, "-") == 'football'.toLowerCase())
        .map(a => a.streams)
        .flat(2)
    if (search) {
        const regEx = RegExp(search, 'i')
        return live.filter((a) => regEx.test(a.name) || regEx.test(a.category_name) || regEx.test(a.tag)).map((resp) => ({
            id: resp.id.toString(),
            name: resp.name,
            type: 'tv',
            background: resp.poster,
            description: resp.name,
            poster: resp.poster,
            posterShape: 'landscape',
            logo: resp.poster,

        }))
    }
    transaction.end()
    return live.map((resp) => ({
        id: resp.id.toString(),
        name: resp.name,
        type: 'tv',
        background: resp.poster,
        description: resp.name,
        poster: resp.poster,
        posterShape: 'landscape',
        logo: resp.poster,
    }))
}

export const getFootballCatalog = async ({ search }: { search?: string }): Promise<MetaPreview[]> => {
    try {
        const now = dayjs().tz('Africa/Nairobi').unix()        
        const thirtyMinutes = dayjs().add(30, 'minutes').unix()
        const footBallCatalog: IFootballEventCatalog[] = await getFromCache('football-catalog')
        const catalog = footBallCatalog.filter(stream => {
            const startsAtMs = dayjs.unix(stream.time).utc().tz('Africa/Nairobi').unix()
            const endTime = dayjs.unix(startsAtMs).utc().add(150, 'minutes').tz('Africa/Nairobi').unix()
            // Convert end time to milliseconds
            return (startsAtMs <= now && now < endTime) || // Currently in progress and not ended
                (startsAtMs > now && startsAtMs <= thirtyMinutes); // Starts within 30 minutes
        }).map((a) => (<MetaPreview>{ id: a.id, name: a.name, type: "tv", posterShape: "landscape", poster: a.poster, logo: a.poster, background: a.poster, description: a.name, }))
        if (search) {
            return catalog.filter((a) => a.name.match(RegExp(search, 'gi')))
        }
        return catalog
    } catch (error) {
        Sentry.captureException(error)
        return []
    }
}
export const footballMetaBuilder = async (id: string): Promise<MetaDetail> => {
    try {
        const catalog = (await getFootballCatalog({})).find((a) => a.id == id)
        if (!catalog) {
            return {
                id: id,
                name: "N/A",
                description: "N/A",
                type: "tv",
            }
        }
        return {
            id,
            name: catalog.name,
            type: "tv",
            description: catalog.description,
            posterShape: "landscape",
            poster: catalog.poster,
            logo: catalog.logo,

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

export const footballStreamsHandler = async (id: string): Promise<Stream[]> => {
    try {
        const footBallCatalog: IFootballEventCatalog[] = await getFromCache('football-catalog')
        return footBallCatalog.find((a) => a.id == id)?.streams ?? []
    } catch (error) {
        Sentry.captureException(error)
        return []
    }
}