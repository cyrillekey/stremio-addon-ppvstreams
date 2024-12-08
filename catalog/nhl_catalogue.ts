import * as Sentry from '@sentry/node'
import dayjs from "dayjs"
import { NhlGameWeek, TvStream, TVUsaStream } from "index"
import { getFromCache, saveToCache } from '../redis'
import { MetaPreview, Stream } from 'stremio-addon-sdk'

const fetchSchedule = async (): Promise<NhlGameWeek[]> => {
    try {
        const date = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
        const response = await fetch(`https://api-web.nhle.com/v1/schedule/${date}`)
        const games = await response.json()
        return games?.gameWeek ?? []
    } catch (error) {
        Sentry.captureException(error)
        return []
    }
}

const fetchTvUsaSportsLinks = async (): Promise<TVUsaStream[]> => {
    try {
        // check if it exist in redis cache
        const exits = await getFromCache('tv-usa-stream')
        if (!exits) {
            const usTvResponse = await fetch('https://848b3516657c-usatv.baby-beamup.club/catalog/tv/all.json')
            const streams = await usTvResponse.json()
            saveToCache('tv-usa-stream', streams['metas'])
            return streams['metas']
        } else {
            return exits as TVUsaStream[]
        }
    } catch (error) {
        Sentry.captureException(error)
        return []
    }
}

export const nhlCatalogueBuilder = async (): Promise<MetaPreview[]> => {
    try {
        const allGameWeeks = await fetchSchedule()
        // filter for only active gameweeks
        const allGames = allGameWeeks.slice(0, 2).map((a) => a.games).flat()
        // filter to include only games that are currently underway
        const underway = allGames.filter((a) => {
            if (a.gameState == "LIVE" || a.gameState == "FUT")
                return a
            // TODO undo after testing is complete
            // if (a.gameState == "FUT") {
            //     const startTime = dayjs(a.startTimeUTC).add(30, 'minutes').unix()
            //     if (startTime < Date.now()) {
            //         return a
            //     }
            // }
        })
        const streams = await fetchTvUsaSportsLinks()
        const meta = underway.reduce((total: MetaPreview[], current) => {
            const availableChannels: TvStream [] = []
            const channel = current.tvBroadcasts.filter((a) => a.countryCode == "US").map((a) => a.network)
            if (channel.includes('MSG')) {
                const exits = streams.find((a) => a.tvgId == "MSG.us")
                if (exits != undefined) {
                    availableChannels.push(...exits.streams)
                }
            }                        
            if (channel.includes('FDSNSUN')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us")
                if (exits != undefined) {
                    if (exits.streams.find((a)=>a.description?.match(/sun/gi)))
                    availableChannels.push(exits.streams.find((a)=>a.description?.match(/sun/gi))!)
                }                
            }
            if (channel.includes('FDSNSO')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us")
                if (exits != undefined) {
                    if (exits.streams.find((a)=>a.description?.match(/south/gi)))
                    availableChannels.push(exits.streams.find((a)=>a.description?.match(/south/gi))!)
                }
            }
            if (channel.includes('FDSNOH')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us")
                if (exits != undefined) {
                    if (exits.streams.find((a)=>a.description?.match(/ohio/gi)))
                    availableChannels.push(exits.streams.find((a)=>a.description?.match(/ohio/gi))!)
                }
            }
            if (channel.includes('FDSNW')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us")
                if (exits != undefined) {
                    if (exits.streams.find((a)=>a.description?.match(/West/)))
                    availableChannels.push(exits.streams.find((a)=>a.description?.match(/West/))!)
                }
                //
            }
            if (channel.includes('FDSNWIX')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us")
                if (exits != undefined) {
                    if (exits.streams.find((a)=>a.description?.match(/Wisconsin/gi)))
                    availableChannels.push(exits.streams.find((a)=>a.description?.match(/Wisconsin/gi))!)
                }
                //
            }
            if (channel.includes('FDSNMW')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us")
                if (exits != undefined) {
                    if (exits.streams.find((a)=>a.description?.match(/Midwest/gi)))
                    availableChannels.push(exits.streams.find((a)=>a.description?.match(/Midwest/gi))!)
                }
            }
            if (channel.includes('NHLN')) {
                const exits = streams.find((a) => a.tvgId == "NHLNetwork.us")
                if (exits != undefined) {
                    availableChannels.push(...exits.streams)
                }
            }
            if (channel.includes('FDSNDET')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us")
                if (exits != undefined) {
                    if (exits.streams.find((a)=>a.description?.match(/detroit/gi)))
                    availableChannels.push(exits.streams.find((a)=>a.description?.match(/detroit/gi))!)
                }
            }            
            if (channel.includes('FDSNNO')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us")
                if (exits != undefined) {
                    if (exits.streams.find((a)=>a.description?.match(/north/gi)))
                    availableChannels.push(exits.streams.find((a)=>a.description?.match(/north/gi))!)
                }
            }
            if (channel.includes('KTTV')) {
                const exits = streams.find((a) => a.tvgId == "WNYW.us")
                if (exits != undefined) {
                    if (exits.streams.find((a)=>a.description?.match(/KTTV/gi)))
                    availableChannels.push(exits.streams.find((a)=>a.description?.match(/KTTV/gi))!)
                }
            }
            if (availableChannels.length > 0) {
                const meta: MetaPreview = {
                    id: `tvusa-${current.id}`,
                    type: "tv",
                    posterShape: "square",
                    poster: "https://res.cloudinary.com/dftgy3yfd/image/upload/nhl-cover_wfpnvg.webp",
                    background: "https://res.cloudinary.com/dftgy3yfd/image/upload/nhl-cover_wfpnvg.webp",
                    logo: "https://static.cdnlogo.com/logos/n/4/nhl-8211-national-hockey-league.png",
                    name: `${current.awayTeam.placeName?.default} ${current.awayTeam.commonName?.default} at ${current.homeTeam.placeName?.default} ${current.homeTeam?.commonName?.default}`,
                    description: `${current.awayTeam.placeName?.default} ${current.awayTeam.commonName?.default} at ${current.homeTeam.placeName?.default} ${current.homeTeam?.commonName?.default}`,
                }
                total.push(meta)
            }
            return total
        }, [])
        return meta

    } catch (error) {
        Sentry.captureException(error)
        return []
    }

}


export const nhlStreamBuilder = async (id:string): Promise<Stream[]> => {
    try {
        const allGameWeeks = await fetchSchedule()
        // filter for only active gameweeks
        const allGames = allGameWeeks.slice(0, 2).map((a) => a.games).flat()
        // filter to include only games that are currently underway
        const underway = allGames.filter((a) => {
            if (a.gameState == "LIVE" || a.gameState == "FUT")
                return a
            // TODO undo after testing is complete
            // if (a.gameState == "FUT") {
            //     const startTime = dayjs(a.startTimeUTC).add(30, 'minutes').unix()
            //     if (startTime < Date.now()) {
            //         return a
            //     }
            // }
        })
        const streams = await fetchTvUsaSportsLinks()
        const meta = underway.reduce((total: TvStream[], current) => {
            const availableChannels: TvStream [] = []
            const channel = current.tvBroadcasts.filter((a) => a.countryCode == "US").map((a) => a.network)
            if (channel.includes('MSG')) {
                const exits = streams.find((a) => a.tvgId == "MSG.us")
                if (exits != undefined) {
                    availableChannels.push(...exits.streams)
                }
            }                        
            if (channel.includes('FDSNSUN')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us")
                if (exits != undefined) {
                    if (exits.streams.find((a)=>a.description?.match(/sun/gi)))
                    availableChannels.push(exits.streams.find((a)=>a.description?.match(/sun/gi))!)
                }                
            }
            if (channel.includes('FDSNSO')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us")
                if (exits != undefined) {
                    if (exits.streams.find((a)=>a.description?.match(/south/gi)))
                    availableChannels.push(exits.streams.find((a)=>a.description?.match(/south/gi))!)
                }
            }
            if (channel.includes('FDSNOH')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us")
                if (exits != undefined) {
                    if (exits.streams.find((a)=>a.description?.match(/ohio/gi)))
                    availableChannels.push(exits.streams.find((a)=>a.description?.match(/ohio/gi))!)
                }
            }
            if (channel.includes('FDSNW')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us")
                if (exits != undefined) {
                    if (exits.streams.find((a)=>a.description?.match(/West/)))
                    availableChannels.push(exits.streams.find((a)=>a.description?.match(/West/))!)
                }
                //
            }
            if (channel.includes('FDSNWIX')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us")
                if (exits != undefined) {
                    if (exits.streams.find((a)=>a.description?.match(/Wisconsin/gi)))
                    availableChannels.push(exits.streams.find((a)=>a.description?.match(/Wisconsin/gi))!)
                }
                //
            }
            if (channel.includes('FDSNMW')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us")
                if (exits != undefined) {
                    if (exits.streams.find((a)=>a.description?.match(/Midwest/gi)))
                    availableChannels.push(exits.streams.find((a)=>a.description?.match(/Midwest/gi))!)
                }
            }
            if (channel.includes('NHLN')) {
                const exits = streams.find((a) => a.tvgId == "NHLNetwork.us")
                if (exits != undefined) {
                    availableChannels.push(...exits.streams)
                }
            }
            if (channel.includes('FDSNDET')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us")
                if (exits != undefined) {
                    if (exits.streams.find((a)=>a.description?.match(/detroit/gi)))
                    availableChannels.push(exits.streams.find((a)=>a.description?.match(/detroit/gi))!)
                }
            }            
            if (channel.includes('FDSNNO')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us")
                if (exits != undefined) {
                    if (exits.streams.find((a)=>a.description?.match(/north/gi)))
                    availableChannels.push(exits.streams.find((a)=>a.description?.match(/north/gi))!)
                }
            }
            if (channel.includes('KTTV')) {
                const exits = streams.find((a) => a.tvgId == "WNYW.us")
                if (exits != undefined) {
                    if (exits.streams.find((a)=>a.description?.match(/KTTV/gi)))
                    availableChannels.push(exits.streams.find((a)=>a.description?.match(/KTTV/gi))!)
                }
            }
            if (`tvusa-${current.id}` ==  id)
            total.push(...availableChannels)
            return total
        }, [])
        return meta

    } catch (error) {
        Sentry.captureException(error)
        return []
    }

}