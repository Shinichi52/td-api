export declare class TradingViewAPI {
    private ws;
    private tickerData;
    private subscriptions;
    private session;
    private sessionRegistered;
    private token;
    private callbackFn;
    private callbackAction;
    private resolveFn;
    constructor(token: string);
    getTicker(tickers: Array<string>, callbackFn: (data: TickerData) => void, callbackAction: (data: {
        [key: string]: any;
    }) => void): Promise<TickerData>;
    private _getTicker;
    private _generateSession;
    private _sendRawMessage;
    private _sendMessage;
    private _registerTicker;
    private _resetWebSocket;
}
//# sourceMappingURL=TradingViewAPI.d.ts.map