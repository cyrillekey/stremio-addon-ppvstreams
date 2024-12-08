"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nhlStreamBuilder = exports.nhlCatalogueBuilder = void 0;
const Sentry = __importStar(require("@sentry/node"));
const dayjs_1 = __importDefault(require("dayjs"));
const redis_1 = require("../redis");
const fetchSchedule = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const date = (0, dayjs_1.default)().subtract(1, 'day').format('YYYY-MM-DD');
        const response = yield fetch(`https://api-web.nhle.com/v1/schedule/${date}`);
        const games = yield response.json();
        return (_a = games === null || games === void 0 ? void 0 : games.gameWeek) !== null && _a !== void 0 ? _a : [];
    }
    catch (error) {
        Sentry.captureException(error);
        return [];
    }
});
const fetchTvUsaSportsLinks = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // check if it exist in redis cache
        const exits = yield (0, redis_1.getFromCache)('tv-usa-stream');
        if (!exits) {
            const usTvResponse = yield fetch('https://848b3516657c-usatv.baby-beamup.club/catalog/tv/all.json');
            const streams = yield usTvResponse.json();
            (0, redis_1.saveToCache)('tv-usa-stream', streams['metas']);
            return streams['metas'];
        }
        else {
            return exits;
        }
    }
    catch (error) {
        Sentry.captureException(error);
        return [];
    }
});
const nhlCatalogueBuilder = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allGameWeeks = yield fetchSchedule();
        // filter for only active gameweeks
        const allGames = allGameWeeks.slice(0, 2).map((a) => a.games).flat();
        // filter to include only games that are currently underway
        const underway = allGames.filter((a) => {
            if (a.gameState == "LIVE" || a.gameState == "FUT")
                return a;
            // TODO undo after testing is complete
            // if (a.gameState == "FUT") {
            //     const startTime = dayjs(a.startTimeUTC).add(30, 'minutes').unix()
            //     if (startTime < Date.now()) {
            //         return a
            //     }
            // }
        });
        const streams = yield fetchTvUsaSportsLinks();
        const meta = underway.reduce((total, current) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            const availableChannels = [];
            const channel = current.tvBroadcasts.filter((a) => a.countryCode == "US").map((a) => a.network);
            if (channel.includes('MSG')) {
                const exits = streams.find((a) => a.tvgId == "MSG.us");
                if (exits != undefined) {
                    availableChannels.push(...exits.streams);
                }
            }
            if (channel.includes('FDSNSUN')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us");
                if (exits != undefined) {
                    if (exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/sun/gi); }))
                        availableChannels.push(exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/sun/gi); }));
                }
            }
            if (channel.includes('FDSNSO')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us");
                if (exits != undefined) {
                    if (exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/south/gi); }))
                        availableChannels.push(exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/south/gi); }));
                }
            }
            if (channel.includes('FDSNOH')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us");
                if (exits != undefined) {
                    if (exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/ohio/gi); }))
                        availableChannels.push(exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/ohio/gi); }));
                }
            }
            if (channel.includes('FDSNW')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us");
                if (exits != undefined) {
                    if (exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/West/); }))
                        availableChannels.push(exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/West/); }));
                }
                //
            }
            if (channel.includes('FDSNWIX')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us");
                if (exits != undefined) {
                    if (exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/Wisconsin/gi); }))
                        availableChannels.push(exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/Wisconsin/gi); }));
                }
                //
            }
            if (channel.includes('FDSNMW')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us");
                if (exits != undefined) {
                    if (exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/Midwest/gi); }))
                        availableChannels.push(exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/Midwest/gi); }));
                }
            }
            if (channel.includes('NHLN')) {
                const exits = streams.find((a) => a.tvgId == "NHLNetwork.us");
                if (exits != undefined) {
                    availableChannels.push(...exits.streams);
                }
            }
            if (channel.includes('FDSNDET')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us");
                if (exits != undefined) {
                    if (exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/detroit/gi); }))
                        availableChannels.push(exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/detroit/gi); }));
                }
            }
            if (channel.includes('FDSNNO')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us");
                if (exits != undefined) {
                    if (exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/north/gi); }))
                        availableChannels.push(exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/north/gi); }));
                }
            }
            if (channel.includes('KTTV')) {
                const exits = streams.find((a) => a.tvgId == "WNYW.us");
                if (exits != undefined) {
                    if (exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/KTTV/gi); }))
                        availableChannels.push(exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/KTTV/gi); }));
                }
            }
            if (availableChannels.length > 0) {
                const meta = {
                    id: `tvusa-${current.id}`,
                    type: "tv",
                    posterShape: "square",
                    poster: "https://res.cloudinary.com/dftgy3yfd/image/upload/nhl-cover_wfpnvg.webp",
                    background: "https://res.cloudinary.com/dftgy3yfd/image/upload/nhl-cover_wfpnvg.webp",
                    logo: "https://static.cdnlogo.com/logos/n/4/nhl-8211-national-hockey-league.png",
                    name: `${(_a = current.awayTeam.placeName) === null || _a === void 0 ? void 0 : _a.default} ${(_b = current.awayTeam.commonName) === null || _b === void 0 ? void 0 : _b.default} at ${(_c = current.homeTeam.placeName) === null || _c === void 0 ? void 0 : _c.default} ${(_e = (_d = current.homeTeam) === null || _d === void 0 ? void 0 : _d.commonName) === null || _e === void 0 ? void 0 : _e.default}`,
                    description: `${(_f = current.awayTeam.placeName) === null || _f === void 0 ? void 0 : _f.default} ${(_g = current.awayTeam.commonName) === null || _g === void 0 ? void 0 : _g.default} at ${(_h = current.homeTeam.placeName) === null || _h === void 0 ? void 0 : _h.default} ${(_k = (_j = current.homeTeam) === null || _j === void 0 ? void 0 : _j.commonName) === null || _k === void 0 ? void 0 : _k.default}`,
                };
                total.push(meta);
            }
            return total;
        }, []);
        return meta;
    }
    catch (error) {
        Sentry.captureException(error);
        return [];
    }
});
exports.nhlCatalogueBuilder = nhlCatalogueBuilder;
const nhlStreamBuilder = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allGameWeeks = yield fetchSchedule();
        // filter for only active gameweeks
        const allGames = allGameWeeks.slice(0, 2).map((a) => a.games).flat();
        // filter to include only games that are currently underway
        const underway = allGames.filter((a) => {
            if (a.gameState == "LIVE" || a.gameState == "FUT")
                return a;
            // TODO undo after testing is complete
            // if (a.gameState == "FUT") {
            //     const startTime = dayjs(a.startTimeUTC).add(30, 'minutes').unix()
            //     if (startTime < Date.now()) {
            //         return a
            //     }
            // }
        });
        const streams = yield fetchTvUsaSportsLinks();
        const meta = underway.reduce((total, current) => {
            const availableChannels = [];
            const channel = current.tvBroadcasts.filter((a) => a.countryCode == "US").map((a) => a.network);
            if (channel.includes('MSG')) {
                const exits = streams.find((a) => a.tvgId == "MSG.us");
                if (exits != undefined) {
                    availableChannels.push(...exits.streams);
                }
            }
            if (channel.includes('FDSNSUN')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us");
                if (exits != undefined) {
                    if (exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/sun/gi); }))
                        availableChannels.push(exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/sun/gi); }));
                }
            }
            if (channel.includes('FDSNSO')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us");
                if (exits != undefined) {
                    if (exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/south/gi); }))
                        availableChannels.push(exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/south/gi); }));
                }
            }
            if (channel.includes('FDSNOH')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us");
                if (exits != undefined) {
                    if (exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/ohio/gi); }))
                        availableChannels.push(exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/ohio/gi); }));
                }
            }
            if (channel.includes('FDSNW')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us");
                if (exits != undefined) {
                    if (exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/West/); }))
                        availableChannels.push(exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/West/); }));
                }
                //
            }
            if (channel.includes('FDSNWIX')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us");
                if (exits != undefined) {
                    if (exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/Wisconsin/gi); }))
                        availableChannels.push(exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/Wisconsin/gi); }));
                }
                //
            }
            if (channel.includes('FDSNMW')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us");
                if (exits != undefined) {
                    if (exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/Midwest/gi); }))
                        availableChannels.push(exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/Midwest/gi); }));
                }
            }
            if (channel.includes('NHLN')) {
                const exits = streams.find((a) => a.tvgId == "NHLNetwork.us");
                if (exits != undefined) {
                    availableChannels.push(...exits.streams);
                }
            }
            if (channel.includes('FDSNDET')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us");
                if (exits != undefined) {
                    if (exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/detroit/gi); }))
                        availableChannels.push(exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/detroit/gi); }));
                }
            }
            if (channel.includes('FDSNNO')) {
                const exits = streams.find((a) => a.tvgId == "FanduelSportsNetwork.us");
                if (exits != undefined) {
                    if (exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/north/gi); }))
                        availableChannels.push(exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/north/gi); }));
                }
            }
            if (channel.includes('KTTV')) {
                const exits = streams.find((a) => a.tvgId == "WNYW.us");
                if (exits != undefined) {
                    if (exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/KTTV/gi); }))
                        availableChannels.push(exits.streams.find((a) => { var _a; return (_a = a.description) === null || _a === void 0 ? void 0 : _a.match(/KTTV/gi); }));
                }
            }
            if (`tvusa-${current.id}` == id)
                total.push(...availableChannels);
            return total;
        }, []);
        return meta;
    }
    catch (error) {
        Sentry.captureException(error);
        return [];
    }
});
exports.nhlStreamBuilder = nhlStreamBuilder;
