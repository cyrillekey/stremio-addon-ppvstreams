import {  fetchDaddyliveSchedule, fetchWorldWideSportStreams } from "catalogs/streams"
import { CronJob } from "cron"
import { saveToCache } from "redis"
import { Stream } from "stremio-addon-sdk"
import { compareDaddyliveStreams } from "utils/index"

interface IDaddyliveEvent {
    id: string
    name: string
    streams: Stream[]
    type: string
    description: string
}


export const buildCatalogCron = new CronJob("0 0,4,8,12 * * *", async () => {
    const channels = await fetchWorldWideSportStreams()    
    const events = (await fetchDaddyliveSchedule())
    const filtered = events.reduce((total: IDaddyliveEvent[], current) => {
        const exists = channels.filter((a) => compareDaddyliveStreams(a.name, current.channels))
        
        if (exists) {
            total.push({id: `wwtv-${current.name.replace(/ /gi,"-").toLowerCase()}`,name: current.name,description: current.name,type:current.type,streams:  exists.map((a)=>a.streams).flat() })
        }
        return total
    }, []) 
    saveToCache('catalog',JSON.stringify(filtered),12 * 60*60)   
})