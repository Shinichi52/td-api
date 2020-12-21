"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessage = exports.prependHeader = exports.parseMessages = void 0;
exports.parseMessages = function (str) {
    var packets = [];
    while (str.length > 0) {
        var x = /~m~(\d+)~m~/.exec(str);
        var packet = str.slice(x[0].length, x[0].length + parseInt(x[1], 10));
        if (packet.substr(0, 3) !== "~h~") {
            packets.push(JSON.parse(packet));
        }
        else {
            packets.push({ "~protocol~keepalive~": packet.substr(3) });
        }
        str.slice(0, x[0].length);
        str = str.slice(x[0].length + parseInt(x[1], 10));
    }
    return packets;
};
exports.prependHeader = function (str) {
    return "~m~" + str.length + "~m~" + str;
};
exports.createMessage = function (func, paramList) {
    return exports.prependHeader(constructMessage(func, paramList));
};
var constructMessage = function (func, paramList) {
    return JSON.stringify({
        m: func,
        p: paramList
    });
};
//# sourceMappingURL=IOProtocol.js.map