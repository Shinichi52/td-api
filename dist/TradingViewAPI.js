"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingViewAPI = void 0;
var randomstring_1 = __importDefault(require("randomstring"));
var ws_1 = __importDefault(require("ws"));
var SIO = __importStar(require("./IOProtocol"));
var TradingViewAPI = /** @class */ (function () {
    function TradingViewAPI(token) {
        this.tickerData = {};
        this.subscriptions = [];
        this.sessionRegistered = false;
        this.token = token || 'unauthorized_user_token';
        this._resetWebSocket();
    }
    TradingViewAPI.prototype.getTicker = function (tickers, callbackFn, callbackAction) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var each = 10;
            var runs = 3000 / each; // time in ms divided by above
            _this.callbackFn = callbackFn;
            _this.callbackAction = callbackAction;
            _this.resolveFn = resolve;
            if (_this.ws.readyState === ws_1.default.CLOSED) {
                _this._resetWebSocket();
            }
            var interval = setInterval(function () {
                if (_this.ws.readyState === ws_1.default.OPEN && _this.sessionRegistered) {
                    _this._getTicker(tickers);
                    clearInterval(interval);
                }
                else if (!runs) {
                    reject("WebSocket connection is closed.");
                    clearInterval(interval);
                }
            }, each);
        });
    };
    TradingViewAPI.prototype._getTicker = function (tickers) {
        for (var index = 0; index < tickers.length; index++) {
            var tickerName = tickers[index];
            // check if ticker is tracked, and if it is, return stored data
            if (this.tickerData[tickerName] && this.tickerData[tickerName].pro_name) {
                this.resolveFn && this.resolveFn(this.tickerData[tickerName]);
                this.callbackFn && this.callbackFn(this.tickerData[tickerName]);
                this.tickerData[tickerName].last_retrieved = new Date();
                return;
            }
            // if not, register and wait for data
            this._registerTicker(tickerName);
            // const each = 10; // how much ms between runs
            // let runs = 3000 / each; // time in ms divided by above
            // const interval = setInterval(() => {
            //   --runs;
            //   if (this.tickerData[tickerName] && this.tickerData[tickerName].pro_name) {
            //     resolve(this.tickerData[tickerName]);
            //     this.tickerData[tickerName].last_retrieved = new Date();
            //     clearInterval(interval);
            //   } else if (!runs) {
            //     this._deleteTicker(tickerName);
            //     reject("Timed out.");
            //     clearInterval(interval);
            //   }
            // }, each);
        }
    };
    TradingViewAPI.prototype._generateSession = function () {
        return "qs_" + randomstring_1.default.generate(12);
    };
    TradingViewAPI.prototype._sendRawMessage = function (message) {
        this.ws.send(SIO.prependHeader(message));
    };
    TradingViewAPI.prototype._sendMessage = function (func, args) {
        this.ws.send(SIO.createMessage(func, args));
    };
    TradingViewAPI.prototype._registerTicker = function (ticker) {
        if (this.subscriptions.indexOf(ticker) !== -1) {
            return;
        }
        this.subscriptions.push(ticker);
        this.ws.send(SIO.createMessage("quote_add_symbols", [
            this.session,
            ticker,
            { flags: ["force_permission"] }
        ]));
    };
    // private _unregisterTicker(ticker: TickerName) {
    //   const index = this.subscriptions.indexOf(ticker);
    //   if (index === -1) {
    //     return;
    //   }
    //   this.subscriptions.splice(index, 1);
    //   this.ws.send(
    //     SIO.createMessage("quote_remove_symbols", [this.session, ticker])
    //   );
    // }
    // private _deleteTicker(ticker: TickerName) {
    //   this._unregisterTicker(ticker);
    //   delete this.tickerData[ticker];
    // }
    TradingViewAPI.prototype._resetWebSocket = function () {
        var _this = this;
        this.tickerData = {};
        this.subscriptions = [];
        this.session = this._generateSession();
        this.sessionRegistered = false;
        this.ws = new ws_1.default("wss://data.tradingview.com/socket.io/websocket", {
            origin: "https://data.tradingview.com"
        });
        this.ws.on("error", function (err) {
            _this.callbackAction({ type: 'error', err: err });
        });
        this.ws.on("close", function (err) {
            _this.callbackAction({ type: 'close', err: err });
        });
        this.ws.on("message", function (data) {
            var packets = SIO.parseMessages(data);
            packets.forEach(function (packet) {
                // reply to keepalive packets
                if (packet["~protocol~keepalive~"]) {
                    _this.callbackAction({ type: 'keepalive', time: new Date().getTime() });
                    _this._sendRawMessage("~h~" + packet["~protocol~keepalive~"]);
                }
                else if (packet.session_id) {
                    // reply to successful connection packet
                    // connecting as unauthorized user
                    _this._sendMessage("set_auth_token", [_this.token]);
                    // registering default ticker session
                    _this._sendMessage("quote_create_session", [_this.session]);
                    _this._sendMessage("quote_set_fields", [
                        _this.session,
                        "ch",
                        "chp",
                        "current_session",
                        "description",
                        "local_description",
                        "language",
                        "exchange",
                        "fractional",
                        "is_tradable",
                        "lp",
                        "minmov",
                        "minmove2",
                        "original_name",
                        "pricescale",
                        "pro_name",
                        "short_name",
                        "type",
                        "update_mode",
                        "volume",
                        "ydsp",
                        "ask",
                        "bid",
                        "bid_size",
                        "ask_size",
                        "fundamentals",
                        "high_price",
                        "is_tradable",
                        "low_price",
                        "open_price",
                        "prev_close_price",
                        "close",
                        "close_price",
                        "rch",
                        "rchp",
                        "rtc",
                        "status",
                        "basic_eps_net_income",
                        "beta_1_year",
                        "earnings_per_share_basic_ttm",
                        "industry",
                        "market_cap_basic",
                        "price_earnings_ttm",
                        "sector",
                        "volume",
                        "dividends_yield"
                    ]);
                    _this.sessionRegistered = true;
                }
                else if (
                // parse ticker data packets
                packet.m &&
                    packet.m === "qsd" &&
                    typeof packet.p === "object" &&
                    packet.p.length > 1 &&
                    packet.p[0] === _this.session) {
                    var tticker = packet.p[1];
                    var tickerName = tticker.n;
                    var tickerStatus = tticker.s;
                    var tickerUpdate = tticker.v;
                    if (tickerUpdate.volume && _this.tickerData[tickerName]) {
                        var diff = tickerUpdate.volume - _this.tickerData[tickerName].volume;
                        _this.tickerData[tickerName].quantity = diff > 0 ? diff : _this.tickerData[tickerName].quantity;
                    }
                    // set ticker data, adding all object parameters together
                    _this.tickerData[tickerName] = Object.assign(_this.tickerData[tickerName] || { last_retrieved: new Date() }, tickerUpdate, { s: tickerStatus }, { last_update: new Date() });
                    _this.callbackFn && _this.callbackFn(_this.tickerData[tickerName]);
                    _this.resolveFn && _this.resolveFn(_this.tickerData[tickerName]);
                    // if (
                    //   Date.now() - this.tickerData[tickerName].last_retrieved >
                    //   1000 * 60
                    // ) {
                    //   this._deleteTicker(tickerName);
                    // }
                }
            });
        });
    };
    return TradingViewAPI;
}());
exports.TradingViewAPI = TradingViewAPI;
//# sourceMappingURL=TradingViewAPI.js.map