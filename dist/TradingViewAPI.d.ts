export declare class TradingViewAPI {
    private ws;
    private tickerData;
    private subscriptions;
    private session;
    private sessionRegistered;
    private token;
    constructor(token: string);
    getTicker(tickerName: string): Promise<TickerData>;
    private _getTicker;
    private _generateSession;
    private _sendRawMessage;
    private _sendMessage;
    private _registerTicker;
    private _unregisterTicker;
    private _deleteTicker;
    private _resetWebSocket;
}
//# sourceMappingURL=TradingViewAPI.d.ts.map