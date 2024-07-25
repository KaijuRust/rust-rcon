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
        this.webSocket.on('open', (e) => {
            this.onConnect(e);
        });
        this.webSocket.on('close', (code, reason) => {
            this.onClose(code, reason);
        });
        this.webSocket.on('error', (e) => {
            this.onError(e);
        });
        this.webSocket.on('message', (data) => {
            this.onMessage(data);
        });
    }
    disconnect() {
        this.webSocket?.close();
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
                let packet = this.processPacket(data);
                if (!packet)
                    return reject("Failed to process packet");
                if (packet.type === packet_1.PacketType.generic && packet.id === commandIdentifier) {
                    this.webSocket?.removeEventListener('message', commandResponseCallback);
                    this.commandIdentifiers.splice(this.commandIdentifiers.indexOf(commandIdentifier));
                    this.emitter.emit('message', packet);
                    return resolve(packet);
                }
            };
            let timeout = this.options.packetSendingTimeout ?? 5000; // Default: 5 seconds
            setTimeout(() => {
                this.webSocket?.removeEventListener('message', commandResponseCallback);
                return reject(`${message} didn't return a response`);
            }, timeout);
            this.webSocket?.on('message', commandResponseCallback);
        });
    }
    generateRandomCommandId() {
        return Math.floor(Math.random() * (RCON_RANGE_MAX - RCON_RANGE_MIN)) + RCON_RANGE_MIN;
    }
    // MARK: - Events
    onConnect(event) {
        this.emitter.emit("connected");
    }
    onError(error) {
        this.emitter.emit("error", error);
    }
    onClose(code, reason) {
        this.emitter.emit("disconnected", code, reason);
    }
    onMessage(serializedData) {
        let data = JSON.parse(serializedData);
        if (data) {
            let packet = this.processPacket(data);
            if (packet) {
                this.emitter.emit('message', packet);
            }
            else {
                console.log("\t|=>" + `Failed to process packet, ${data.Message}`);
            }
        }
        else {
            console.log(`ERROR ERROR onMessage called and failed to parse object, Data: ${serializedData}`);
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
            case packet_1.PacketType.report:
                return {
                    id: identifier,
                    type: packet_1.PacketType.report,
                    payload: JSON.parse(data.Message)
                };
            default:
                console.log("\t|=>" + `Unknown packet type, ${data.Type}`);
                return;
        }
    }
}
exports.Client = Client;
