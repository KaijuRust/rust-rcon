"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RCON = void 0;
const ws_1 = __importDefault(require("ws"));
const events_1 = __importDefault(require("events"));
class RCON {
    options;
    webSocket;
    emitter = new events_1.default();
    // MARK: - Constructor
    constructor(options) {
        this.options = options;
    }
    // MARK: - Connection
    connect() {
        this.webSocket = new ws_1.default(`ws://${this.options.host}:${this.options.port}/${this.options.password}`);
        this.webSocket.on("open", this.onConnect);
        this.webSocket.on("error", this.onError);
        this.webSocket.on("close", this.onClose);
        this.webSocket.on("message", this.onMessage);
    }
    // MARK: - Events
    onConnect(webSocket) {
        console.log("Connected to RCON");
        // this.emit("connected", webSocket);
    }
    onError(webSocket, error) {
        console.error("RCON Error:", error);
        // this.emit("error", webSocket, error);
    }
    onClose(webSocket, code, reason) {
        console.log("RCON Closed:", code, reason.toString());
        // this.emit("closed", webSocket, code, reason);
    }
    onMessage(webSocket, data, isBinary) {
        console.log("RCON Message:", data, isBinary);
        // this.emit("message", webSocket, data, isBinary);
    }
}
exports.RCON = RCON;
