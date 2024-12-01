"use strict";
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
exports.getFromCache = exports.saveToCache = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default({ host: "redis-12396.c245.us-east-1-3.ec2.redns.redis-cloud.com", port: 12396, password: "6zBhg6grpa4lVG00KZX0YK1wfMlIUhzn", name: "db-LYKF5ZB0", username: "default" });
const saveToCache = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    yield redis.set(id.toString(), JSON.stringify(data));
});
exports.saveToCache = saveToCache;
const getFromCache = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const record = yield redis.get(id);
    if (!record) {
        return null;
    }
    return JSON.parse(record);
});
exports.getFromCache = getFromCache;
