"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const ws_1 = __importDefault(require("ws"));
const events_1 = __importDefault(require("events"));
const packet_1 = require("./packet");
const RCON_RANGE_MIN = 1337000000;
const RCON_RANGE_MAX = 1337999999;
class Client {
    options;
    webSocket;
    emitter = new events_1.default();
    on = this.emitter.on.bind(this.emitter);
    once = this.emitter.once.bind(this.emitter);
    off = this.emitter.removeListener.bind(this.emitter);
    commandIdentifiers = [];
    // MARK: - Constructor
    constructor(options) {
        this.options = options;
    }
    // MARK: - Connection
    connect() {
        this.webSocket = new ws_1.default(`ws://${this.options.host}:${this.options.port}/${this.options.password}`);
        // this.webSocket.on("open", this.onConnect);
        this.webSocket.on("error", this.onError);
        this.webSocket.on("close", this.onClose);
        // this.webSocket.on("message", this.onMessage);
        // this.webSocket.onmessage = this.onMessage.bind(this);
        this.webSocket.on('open', (e) => {
            this.onConnect(e);
        });
        this.webSocket.on('message', (data) => {
            this.onMessage(data);
        });
    }
    // MARK: - Messages
    send(message, name, identifier) {
        let commandIdentifier = identifier ? identifier : this.generateRandomCommandId();
        this.webSocket?.send(JSON.stringify({
            Identifier: commandIdentifier,
            Message: message,
            Name: name
        }));
    }
    sendAndWait(message, name, identifier) {
        let commandIdentifier = identifier ? identifier : this.generateRandomCommandId();
        this.commandIdentifiers.push(commandIdentifier);
        this.send(message, name, commandIdentifier);
        return new Promise((resolve, reject) => {
            const commandResponseCallback = (serializedData) => {
                const data = JSON.parse(serializedData);
                if (data.Type === packet_1.PacketType.generic && data.Identifier === commandIdentifier) {
                    this.webSocket?.removeEventListener('message', commandResponseCallback);
                    this.commandIdentifiers.splice(this.commandIdentifiers.indexOf(commandIdentifier));
                    let packet = this.processPacket(data);
                    if (packet) {
                        this.emitter.emit('message', packet);
                        return resolve(packet);
                    }
                    else {
                        return reject("Failed to process packet");
                    }
                }
            };
            setTimeout(() => {
                this.webSocket?.removeEventListener('message', commandResponseCallback);
                return reject(`${message} didn't return a response`);
            }, 5 * 1000);
            this.webSocket?.on('message', commandResponseCallback);
        });
    }
    sendMessage(message) {
        this.webSocket?.send(JSON.stringify({
            // Identifier: parseInt(identifier ?? 69420),
            Message: message,
            // Name: name
        }));
    }
    generateRandomCommandId() {
        return Math.floor(Math.random() * (RCON_RANGE_MAX - RCON_RANGE_MIN)) + RCON_RANGE_MIN;
    }
    // MARK: - Events
    onConnect(event) {
        console.log(`Connected to RCON`);
        this.emitter.emit("connected");
    }
    onError(error) {
        console.error("RCON Error:", error);
        // this.emit("error", webSocket, error);
    }
    onClose(event) {
        console.log("RCON Closed:", event.code, event.reason);
        // this.emit("closed", webSocket, code, reason);
    }
    onMessage(serializedData) {
        const data = JSON.parse(serializedData);
        let packet = this.processPacket(data);
        if (packet) {
            this.emitter.emit('message', packet);
        }
        else {
            console.log("\t|=>" + `Failed to process packet, ${data.Message}`);
        }
    }
    // MARK: - Packet processing
    processPacket(data) {
        let identifier = parseInt(data.Identifier);
        switch (data.Type) {
            case packet_1.PacketType.error:
                return {
                    id: identifier,
                    type: packet_1.PacketType.error,
                    payload: data.Message
                };
            case packet_1.PacketType.warning:
                return {
                    id: identifier,
                    type: packet_1.PacketType.warning,
                    payload: data.Message
                };
            case packet_1.PacketType.generic:
                let content;
                try {
                    content = JSON.parse(data.Message);
                }
                catch {
                    content = data.Message;
                }
                return {
                    id: identifier,
                    type: packet_1.PacketType.generic,
                    payload: content
                };
            case packet_1.PacketType.chat:
                return {
                    id: identifier,
                    type: packet_1.PacketType.chat,
                    payload: JSON.parse(data.Message)
                };
            default:
                console.log("\t|=>" + `Unknown packet type, ${data.Type}`);
                return;
        }
    }
}
exports.Client = Client;
