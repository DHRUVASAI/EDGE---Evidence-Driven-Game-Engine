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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCricinfoPlayerImage = getCricinfoPlayerImage;
exports.resolveAndStorePlayerImage = resolveAndStorePlayerImage;
var https = require("https");
var http = require("http");
var UA = 'CricMetrics/1.0 (cricket analytics; contact@cricmetrics.dev)';
var NAME_EXPANSIONS = {
    'v kohli': 'Virat Kohli',
    'rg sharma': 'Rohit Sharma',
    'spd smith': 'Steven Smith',
    'steve smith': 'Steven Smith',
    'ms dhoni': 'MS Dhoni',
    'jm anderson': 'James Anderson',
    'ab de villiers': 'AB de Villiers',
    'ch gayle': 'Chris Gayle',
    'sr tendulkar': 'Sachin Tendulkar',
    'kc sangakkara': 'Kumar Sangakkara',
    'je root': 'Joe Root',
    'ks williamson': 'Kane Williamson',
    'da warner': 'David Warner',
    'sk raina': 'Suresh Raina',
    'rv uthappa': 'Robin Uthappa',
    'f du plessis': 'Faf du Plessis',
    's dhawan': 'Shikhar Dhawan',
    'sc ganguly': 'Sourav Ganguly',
    'v sehwag': 'Virender Sehwag',
    'jh kallis': 'Jacques Kallis',
    'm muralitharan': 'Muttiah Muralitharan',
    'sk warne': 'Shane Warne',
    'gd mcgrath': 'Glenn McGrath',
    'b lee': 'Brett Lee',
    'dw steyn': 'Dale Steyn',
    'z khan': 'Zaheer Khan',
    'j bumrah': 'Jasprit Bumrah',
    'jj bumrah': 'Jasprit Bumrah',
    'kl rahul': 'KL Rahul',
    'r ashwin': 'Ravichandran Ashwin',
    'ra jadeja': 'Ravindra Jadeja',
    'hh pandya': 'Hardik Pandya',
    'n pooran': 'Nicholas Pooran',
    'ka pollard': 'Kieron Pollard',
    'ad russell': 'Andre Russell',
    'sp narine': 'Sunil Narine',
    'gj maxwell': 'Glenn Maxwell',
    'm stoinis': 'Marcus Stoinis',
    'a zampa': 'Adam Zampa',
    'jc buttler': 'Jos Buttler',
    'ba stokes': 'Ben Stokes',
    'w hasaranga': 'Wanindu Hasaranga',
    'rk': 'Rashid Khan',
    'r khan': 'Rashid Khan',
    'rashid khan': 'Rashid Khan Arman'
};
function expandName(name) {
    if (!name)
        return '';
    var clean = name.trim();
    var lower = clean.toLowerCase();
    return NAME_EXPANSIONS[lower] || clean;
}
function nodeGet(url, method, timeoutMs) {
    if (method === void 0) { method = 'GET'; }
    if (timeoutMs === void 0) { timeoutMs = 4000; }
    return new Promise(function (resolve) {
        var mod = url.startsWith('https') ? https : http;
        var timer = setTimeout(function () { req.destroy(); resolve(null); }, timeoutMs);
        var req = mod.request(url, { method: method, headers: { 'User-Agent': UA } }, function (res) {
            var _a;
            if (method === 'HEAD') {
                res.resume();
                clearTimeout(timer);
                resolve({ status: (_a = res.statusCode) !== null && _a !== void 0 ? _a : 0, body: '' });
                return;
            }
            var body = '';
            res.setEncoding('utf8');
            res.on('data', function (chunk) { body += chunk; });
            res.on('end', function () { var _a; clearTimeout(timer); resolve({ status: (_a = res.statusCode) !== null && _a !== void 0 ? _a : 0, body: body }); });
        });
        req.on('error', function () { clearTimeout(timer); resolve(null); });
        req.end();
    });
}
function isValidImage(url) {
    if (!url || typeof url !== 'string')
        return false;
    if (!url.startsWith('http'))
        return false;
    var lower = url.toLowerCase();
    if (lower.includes('icon512.png') || lower.includes('placeholder') || lower.includes('default.jpg') || lower.includes('no-image')) {
        return false;
    }
    return true;
}
function getCricinfoPlayerImage(name) {
    return __awaiter(this, void 0, void 0, function () {
        var searchName, searchUrl, res, regex, matches, match, i, playerId, imgUrl, imgRes, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    searchName = expandName(name);
                    searchUrl = "https://search.cricinfo.com/ci/content/player/search.html?search=".concat(encodeURIComponent(searchName));
                    return [4 /*yield*/, nodeGet(searchUrl)];
                case 1:
                    res = _a.sent();
                    if (!(res && res.status === 200)) return [3 /*break*/, 5];
                    regex = /\/content\/player\/(\d+)\.html/ig;
                    matches = [];
                    match = void 0;
                    while ((match = regex.exec(res.body)) !== null) {
                        matches.push(match);
                    }
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < Math.min(matches.length, 5))) return [3 /*break*/, 5];
                    playerId = matches[i][1];
                    imgUrl = "https://a.espncdn.com/i/headshots/cricket/players/full/".concat(playerId, ".png");
                    return [4 /*yield*/, nodeGet(imgUrl, 'HEAD', 3000)];
                case 3:
                    imgRes = _a.sent();
                    if (imgRes && imgRes.status === 200) {
                        return [2 /*return*/, imgUrl];
                    }
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5: return [3 /*break*/, 7];
                case 6:
                    err_1 = _a.sent();
                    console.error('Error fetching Cricinfo player image:', err_1);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/, null];
            }
        });
    });
}
function resolveAndStorePlayerImage(playerId, name, cricapiId) {
    return __awaiter(this, void 0, void 0, function () {
        var targetName, prisma, dbPlayer, _a, imageUrl, e_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    targetName = name || '';
                    prisma = global.prisma;
                    if (!(playerId && prisma && prisma.player)) return [3 /*break*/, 4];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, prisma.player.findUnique({
                            where: { id: playerId },
                            select: { name: true, fullName: true, imageUrl: true }
                        })];
                case 2:
                    dbPlayer = _b.sent();
                    if (dbPlayer) {
                        if (dbPlayer.imageUrl && dbPlayer.imageUrl.includes('espncdn.com')) {
                            return [2 /*return*/, dbPlayer.imageUrl];
                        }
                        if (!targetName) {
                            targetName = dbPlayer.fullName || dbPlayer.name;
                        }
                    }
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4:
                    if (!targetName)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, getCricinfoPlayerImage(targetName)];
                case 5:
                    imageUrl = _b.sent();
                    if (!(imageUrl && playerId && prisma && prisma.player)) return [3 /*break*/, 9];
                    _b.label = 6;
                case 6:
                    _b.trys.push([6, 8, , 9]);
                    return [4 /*yield*/, prisma.player.update({
                            where: { id: playerId },
                            data: { imageUrl: imageUrl },
                        })];
                case 7:
                    _b.sent();
                    return [3 /*break*/, 9];
                case 8:
                    e_1 = _b.sent();
                    console.error("Failed to update Player ".concat(playerId, " imageUrl in DB:"), e_1);
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/, imageUrl];
            }
        });
    });
}
