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

export const availableTimeZones = [
    "Africa/Abidjan UTC+00:00",      // Representative for UTC+00:00
    "Europe/London UTC+00:00",       // Alternative for UTC+00:00
    "Europe/Paris UTC+01:00",        // Representative for UTC+01:00
    "Europe/Berlin UTC+01:00",       // Alternative for UTC+01:00
    "Europe/Athens UTC+02:00",       // Representative for UTC+02:00
    "Africa/Cairo UTC+02:00",        // Alternative for UTC+02:00
    "Africa/Nairobi UTC+03:00",      // Representative for UTC+03:00
    "Europe/Moscow UTC+03:00",       // Alternative for UTC+03:00
    "Asia/Dubai UTC+04:00",          // Representative for UTC+04:00
    "Asia/Karachi UTC+05:00",        // Representative for UTC+05:00
    "Asia/Dhaka UTC+06:00",          // Representative for UTC+06:00
    "Asia/Bangkok UTC+07:00",        // Representative for UTC+07:00
    "Asia/Singapore UTC+08:00",      // Representative for UTC+08:00
    "Asia/Tokyo UTC+09:00",          // Representative for UTC+09:00
    "Australia/Sydney UTC+10:00",    // Representative for UTC+10:00
    "Pacific/Noumea UTC+11:00",      // Representative for UTC+11:00
    "Pacific/Fiji UTC+12:00",        // Representative for UTC+12:00
    "Pacific/Tongatapu UTC+13:00",   // Representative for UTC+13:00
    "Pacific/Kiritimati UTC+14:00",  // Representative for UTC+14:00
    "Pacific/Midway UTC-11:00",      // Representative for UTC-11:00
    "Pacific/Honolulu UTC-10:00",    // Representative for UTC-10:00
    "America/Anchorage UTC-09:00",   // Representative for UTC-09:00
    "America/Los_Angeles UTC-08:00", // Representative for UTC-08:00
    "America/Denver UTC-07:00",      // Representative for UTC-07:00
    "America/Chicago UTC-06:00",     // Representative for UTC-06:00
    "America/New_York UTC-05:00",    // Representative for UTC-05:00
    "America/Caracas UTC-04:00",     // Representative for UTC-04:00
    "America/Buenos_Aires UTC-03:00",// Representative for UTC-03:00
    "Atlantic/South_Georgia UTC-02:00", // Representative for UTC-02:00
    "Atlantic/Azores UTC-01:00",     // Representative for UTC-01:00
];

