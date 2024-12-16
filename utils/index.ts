import { daddyliveCountries } from "./countries"

/**
 * 
 * @param channelName world wide sports channel
 * @param streamName channels event ffets
 * @returns if channel exists in world wide sports
 */
export const compareDaddyliveStreams = (channelName: string, streamName: string[]): boolean => {
    // handle bein as a special case
    if (channelName.match(/bein sports$/gi)) {
        const existsBeinUsa = streamName.includes('beIN SPORTS USA')
        return existsBeinUsa
    } else {
        const regEx = RegExp(channelName, 'gi')
        const exists = streamName.findIndex((a) => {
            // extract country from worldwide events
            const country = a.split(" ")?.at(-1)
            if (daddyliveCountries.includes(country!)) {
                if (country == 'USA' || country == 'UK') {
                    if (country == 'USA') {
                        const newName = a.replace(' USA', '')
                        return newName.match(regEx)
                    } else {
                        const newName = a.replace(' UK', '')
                        return newName.match(regEx)
                    }
                } else {
                    return false
                }
            }
            return a.match(regEx)

        })
        return exists > -1
    }


}