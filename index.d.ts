import { Stream as TvStream } from "stremio-addon-sdk"
export interface IPPVLandStream {
    category: string;
    id: number;
    always_live: number;
    streams: Stream[];
}

export interface Stream {
    id: number;
    name: string;
    tag: string;
    poster: string;
    uri_name: string;
    starts_at: number;
    ends_at: number;
    always_live: number;
    category_name: string;
    allowpaststreams: number;
}
export interface IPPLandStreamDetails {
    success: boolean;
    data: Data;
}

export interface Data {
    id: number;
    name: string;
    poster: string;
    tag: string;
    description: string;
    m3u8: string;
    source: string;
    source_type: string;
    start_timestamp: number;
    end_timestamp: number;
    vip_stream: number;
    auth: boolean;
    edit: null;
    server_id: number;
    clipping: boolean;
    token: null;
    vip_mpegts: string;
}

export interface NhlGameWeek {
    date: Date;
    dayAbbrev: string;
    numberOfGames: number;
    datePromo: DatePromo[];
    games: Game[];
}

export interface DatePromo {
    default: Default;
    country: Country;
}

export type Country = "US" | "CA";
export interface Default {
    text: string;
    logoText: string;
    lightLogoUrl: string;
    darkLogoUrl: string;
}

export interface Game {
    id: number;
    season: number;
    gameType: number;
    venue: Venue;
    neutralSite: boolean;
    startTimeUTC: Date;
    easternUTCOffset: UTCOffset;
    venueUTCOffset: UTCOffset;
    venueTimezone: string;
    gameState: GameState;
    gameScheduleState: GameScheduleState;
    tvBroadcasts: TvBroadcast[];
    awayTeam: Team;
    homeTeam: Team;
    periodDescriptor: PeriodDescriptor;
    gameOutcome?: GameOutcome;
    winningGoalie?: WinningGoal;
    winningGoalScorer?: WinningGoal;
    threeMinRecap?: string;
    threeMinRecapFr?: string;
    condensedGame?: string;
    condensedGameFr?: string;
    gameCenterLink: string;
    ticketsLink?: string;
    ticketsLinkFr?: string;
}

export interface Team {
    id: number;
    commonName: Venue;
    placeName: Venue;
    placeNameWithPreposition: Venue;
    abbrev: string;
    logo: string;
    darkLogo: string;
    awaySplitSquad?: boolean;
    score?: number;
    radioLink?: string;
    odds?: Odd[];
    homeSplitSquad?: boolean;
}

export interface Venue {
    default: string;
    fr?: string;
}

export interface Odd {
    providerId: number;
    value: string;
}

export type UTCOffset = "-05:00" | "-06:00" | "-08:00" | "-07:00";

export interface GameOutcome {
    lastPeriodType: PeriodType;
}

export type PeriodType = "REG" | "OT";

export type GameScheduleState = "OK";

export type GameState = "OFF" | "LIVE" | "FUT";

export interface PeriodDescriptor {
    number: number;
    periodType: PeriodType;
    maxRegulationPeriods: number;
}

export interface TvBroadcast {
    id: number;
    market: Market;
    countryCode: Country;
    network: string;
    sequenceNumber: number;
}
export type Market = "N" | "A" | "H";

export interface WinningGoal {
    playerId: number;
    firstInitial: FirstInitial;
    lastName: FirstInitial;
}

export interface FirstInitial {
    default: string;
}


export interface TVUsaStream {
    id: string;
    type: string;
    name: string;
    description: string;
    genres: string[];
    poster: string;
    logo: string;
    tvgId: string;
    streams: TvStream[];
}

