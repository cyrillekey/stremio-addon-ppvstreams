import * as Sentry from '@sentry/node'
import dayjs from "dayjs"
import { NhlGameWeek, TVUsaStream } from "index"
import { getFromCache, saveToCache } from 'redis'
import { MetaPreview } from 'stremio-addon-sdk'

const fetchSchedule = async ():Promise<NhlGameWeek []> => {
    try {
        const date = dayjs().subtract(1,'day').format('YYYY-MM-DD')
        const response = await fetch(`https://api-web.nhle.com/v1/schedule/${date}`)
        const games = await response.json()
        return games?.gameWeek ?? []
    } catch (error) {
        Sentry.captureException(error)
        return []
    }
}

const fetchTvUsaSportsLinks = async ():Promise<TVUsaStream []> => {
    try {
        // check if it exist in redis cache
        const exits = await getFromCache('tv-usa-stream')
        if (!exits) {
            const usTvResponse = await fetch('https://848b3516657c-usatv.baby-beamup.club/catalog/tv/all.json')
            const streams = await usTvResponse.json()
            saveToCache('tv-usa-stream',streams['metas'])
            return streams['metas']
        } else {
        return exits as TVUsaStream []
        }
    } catch (error) {
        Sentry.captureException(error)
        return []
    }
}

export const nhlCatalogueBuilder = async ():Promise<MetaPreview []> => {
    try {
        const allGameWeeks = await fetchSchedule()
        // filter for only active gameweeks
        const allGames = allGameWeeks.slice(0,2).map((a)=>a.games).flat()
        // filter to include only games that are currently underway
        const underway = allGames.filter((a)=> {
            if (a.gameState == "LIVE")
                return a
            if (a.gameState == "FUT") {
                const startTime = dayjs(a.startTimeUTC).add(30,'minutes').unix()
                if (startTime < Date.now()) {
                    return a
                }
            }
        })
        const streams = await fetchTvUsaSportsLinks()
        const meta = underway.reduce((total:MetaPreview [],current)=> {
            const availableChannels = []
            const channel = current.tvBroadcasts.filter((a)=>a.countryCode == "US").map((a)=>a.network)            
            if (channel.includes('MSG')) {
                const exits = streams.find((a)=>a.tvgId == "MSG.us")
                if (exits != undefined) {
                    availableChannels.push(exits.streams)
                }
            }
            if (availableChannels.length > 0) {
                const meta:MetaPreview = {
                    id: `tvusa-${current.id}`,
                    type: "tv",
                    posterShape: "square",
                    logo:"https://static.cdnlogo.com/logos/n/4/nhl-8211-national-hockey-league.png",
                    name: `${current.awayTeam.placeName} ${current.awayTeam.commonName} at ${current.homeTeam.placeName} ${current.homeTeam}`,
                    description: `${current.awayTeam.placeName} ${current.awayTeam.commonName} at ${current.homeTeam.placeName} ${current.homeTeam}`,                  
                }
                total.push(meta)
            }
            return total
        },[])
        return meta
        
    } catch (error) {
        Sentry.captureException(error)
        return []
    }
    
}
