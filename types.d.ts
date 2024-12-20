import { Stream as StremioStream } from "stremio-addon-sdk";

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

export interface IRapidCricketEvent {
    team_b_id: number;
    date_wise: string;
    max_rate: string;
    match_id: number;
    venue: string;
    match_status: string;
    matchs: string;
    venue_id: number;
    series: string;
    team_a_id: number;
    match_date: string;
    team_a_img: string;
    min_rate: string;
    match_time: string;
    match_type: string;
    team_b_img: string;
    team_b_short: string;
    team_b: string;
    team_a_short: string;
    fav_team: string;
    team_a: string;
    is_hundred: number;
    series_id: number;
    series_type: string;
}

export interface FootballHighlightEvent {
    id: number;
    round: string;
    date: Date;
    country: Country;
    state: State;
    awayTeam: AwayTeam;
    homeTeam: AwayTeam;
    league: AwayTeam;
}

export interface AwayTeam {
    id: number;
    logo: null | string;
    name: string;
    season?: number;
}
export interface Country {
    code: string;
    name: string;
    logo: string;
}

export interface State {
    clock: number | null;
    score: Score;
    description: Description;
}

export interface Score {
    current: null | string;
    penalties: null;
}
export type Description = "Finished" | "To be announced" | "Not started" | "Postponed";

export interface RapidApiLiveFootballEvent {
    league: string;
    home_flag: string;
    home_name: string;
    away_flag: string;
    away_name: string;
    date: string;
    time: string;
    status: Status;
    score: string;
    id: string;
    link?: string
}


export interface IFootballEventCatalog {
    id: string
    time: number
    name: string
    description: string
    poster: string
    streams: StremioStream []
}

export type Status = "Live" | "Uncoming";
interface AppConfig {
    timeZone?:string
}

declare module 'stremio-addon-sdk' {
    interface Args {
        config: AppConfig
    }
}