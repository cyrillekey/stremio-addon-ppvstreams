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
Object.defineProperty(exports, "__esModule", { value: true });
const Sentry = __importStar(require("@sentry/node"));
const stremio_addon_sdk_1 = require("stremio-addon-sdk");
const nhl_catalogue_1 = require("./catalog/nhl_catalogue");
// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
const manifest = {
    id: 'community.ppvstreams',
    version: '0.0.7',
    logo: "https://res.cloudinary.com/dftgy3yfd/image/upload/v1732693733/ppv-streams_wolcio.webp",
    catalogs: [
        { id: 'basketball', type: 'tv', name: 'Basketball', extra: [{ name: "search", isRequired: false }] },
        { id: 'football', name: 'Football', type: 'tv', extra: [{ name: "search", isRequired: false }] },
        { id: 'Arm Wrestling', name: 'Arm Wrestling', type: 'tv', extra: [{ name: "search", isRequired: false }] },
        { id: 'Rugby', name: 'Rugby', type: 'tv', extra: [{ name: "search", isRequired: false }] },
        { id: 'NFL', name: 'NFL', type: 'tv', extra: [{ name: "search", isRequired: false }] },
        { id: "Combat Sports", name: "Combat sports", type: "tv", extra: [{ name: "search", isRequired: false }] },
        { id: "Wrestling", name: "Wrestling", type: "tv", extra: [{ name: "search", isRequired: false }] },
        { id: "Formula 1", name: "Formula One", type: "tv", extra: [{ name: "search", isRequired: false }] },
        { id: "Ice Hockey", name: "Ice Hockey", type: "tv", extra: [{ name: "search", isRequired: false },], },
        {
            id: 'Darts',
            name: 'Darts',
            type: 'tv',
            extra: [{ name: "search", isRequired: false }]
        },
    ],
    contactEmail: "cyrilleotieno7@gmail.com",
    resources: [
        { name: 'stream', types: ['tv'] },
        { name: 'meta', types: ['tv'] },
    ],
    types: ['tv'],
    name: 'ppvstreams',
    description: 'Stream your favorite live sports, featuring football (soccer), NFL, basketball, wrestling, darts, and more. Enjoy real-time access to popular games and exclusive events, all conveniently available in one place. This add-on is based on PPV Land.',
};
const supported_id = manifest.catalogs.map((a) => a.id);
function getLiveFootballCatalog(id, search) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const transaction = Sentry.startSpanManual({ name: `Get ${id} catalogue`, op: "http.server" }, (span) => span);
            const now = Date.now();
            const thirtyMinutes = 30 * 60 * 1000;
            const matches = yield fetch('https://ppv.land/api/streams');
            const response = yield matches.json();
            const results = (_a = response.streams) !== null && _a !== void 0 ? _a : [];
            const live = results
                .filter(a => a.category.toLowerCase() == id.toLowerCase())
                .map(a => a.streams)
                .flat(2).filter(stream => {
                const startsAtMs = stream.starts_at * 1000; // Convert start time to milliseconds
                // Convert end time to milliseconds
                return (startsAtMs <= now) || // Currently in progress
                    (startsAtMs > now && startsAtMs <= now + thirtyMinutes); // Starts within 30 minutes
            });
            if (search) {
                const regEx = RegExp(search, 'i');
                return live.filter((a) => regEx.test(a.name) || regEx.test(a.category_name) || regEx.test(a.tag));
            }
            transaction.end();
            return live;
        }
        catch (error) {
            Sentry.captureException(error);
            return [];
        }
    });
}
function getMovieStreams(id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        try {
            const transaction = Sentry.startSpanManual({ name: `Get ${id} streams link`, op: "http:server" }, (span) => span);
            const streams = yield fetch(`https://ppv.land/api/streams/${id}`);
            const response = yield streams.json();
            transaction.end();
            return [
                {
                    name: (_b = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "N/A",
                    url: (_d = (_c = response === null || response === void 0 ? void 0 : response.data) === null || _c === void 0 ? void 0 : _c.source) !== null && _d !== void 0 ? _d : "N/A",
                    title: (_f = (_e = response === null || response === void 0 ? void 0 : response.data) === null || _e === void 0 ? void 0 : _e.tag) !== null && _f !== void 0 ? _f : "N/A",
                    behaviorHints: { notWebReady: true, },
                },
            ];
        }
        catch (error) {
            Sentry.captureException(error);
            return [];
        }
    });
}
function getMovieMetaDetals(id) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;
        try {
            const transaction = Sentry.startSpanManual({ name: `Get ${id} stream details`, op: "http:server" }, (span) => span);
            const streams = yield fetch(`https://ppv.land/api/streams/${id}`);
            const response = yield streams.json();
            transaction.end();
            return {
                name: (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "N/A",
                id: id,
                type: 'tv',
                poster: (_d = (_c = response === null || response === void 0 ? void 0 : response.data) === null || _c === void 0 ? void 0 : _c.poster) !== null && _d !== void 0 ? _d : "https://placehold.co/600x400",
                posterShape: 'landscape',
                background: (_f = (_e = response === null || response === void 0 ? void 0 : response.data) === null || _e === void 0 ? void 0 : _e.poster) !== null && _f !== void 0 ? _f : "https://placehold.co/600x400",
                language: 'english',
                website: response.data.source,
            };
        }
        catch (error) {
            Sentry.captureException(error);
            return { id: id, name: 'N/A', type: 'channel' };
        }
    });
}
const builder = new stremio_addon_sdk_1.addonBuilder(manifest);
builder.defineCatalogHandler((_a) => __awaiter(void 0, [_a], void 0, function* ({ id, extra }) {
    let results = [];
    // PREVENT QUERYING FOR NON PPV EVENTS
    if (supported_id.includes(id))
        if (id == "Ice Hockey") {
            results = yield (0, nhl_catalogue_1.nhlCatalogueBuilder)();
        }
        else {
            results = (yield getLiveFootballCatalog(id, extra.search)).map(resp => ({
                id: resp.id.toString(),
                name: resp.name,
                type: 'tv',
                background: resp.poster,
                description: resp.name,
                poster: resp.poster,
                posterShape: 'landscape',
                logo: resp.poster,
            }));
        }
    return {
        metas: results,
        cacheMaxAge: 60,
        staleRevalidate: 60,
        staleError: 24 * 60 * 60
    };
}));
builder.defineMetaHandler((_a) => __awaiter(void 0, [_a], void 0, function* ({ id }) {
    const regEx = RegExp(/^\d+$/gm);
    if (!regEx.test(id)) {
        if (id.match(/tvusa/gi)) {
            const catalog = yield (0, nhl_catalogue_1.nhlCatalogueBuilder)();
            const item = catalog.find((a) => a.id == id);
            if (item)
                return {
                    meta: {
                        id,
                        name: item.name,
                        description: item.description,
                        type: "tv",
                        background: item === null || item === void 0 ? void 0 : item.background,
                        poster: item === null || item === void 0 ? void 0 : item.poster,
                        posterShape: item === null || item === void 0 ? void 0 : item.posterShape,
                        country: "USA",
                        logo: item === null || item === void 0 ? void 0 : item.logo,
                    }
                };
        }
        return {
            meta: {
                id: id,
                name: 'N/A',
                type: "tv",
            }
        };
    }
    const meta = yield getMovieMetaDetals(id);
    return {
        meta,
        cacheMaxAge: 60,
        staleError: 24 * 60 * 60,
        staleRevalidate: 60
    };
}));
builder.defineStreamHandler((_a) => __awaiter(void 0, [_a], void 0, function* ({ id }) {
    const regEx = RegExp(/^\d+$/gm);
    if (!regEx.test(id)) {
        if (id.match(/tvusa/gi)) {
            const catalog = yield (0, nhl_catalogue_1.nhlStreamBuilder)(id);
            console.log(catalog);
            return {
                streams: catalog
            };
        }
        return {
            streams: []
        };
    }
    const streams = yield getMovieStreams(id);
    return {
        streams,
        cacheMaxAge: 60,
        staleRevalidate: 60,
        staleError: 24 * 60 * 60
    };
}));
exports.default = builder.getInterface();
