import TypedEmitter from "typed-emitter";
import { Options } from "./options";
import { Events } from "./events";
import { Packet } from "./packet";
export declare class Client {
    readonly options: Options;
    private webSocket?;
    private emitter;
    on: <E extends keyof Events>(event: E, listener: Events[E]) => TypedEmitter<Events>;
    once: <E extends keyof Events>(event: E, listener: Events[E]) => TypedEmitter<Events>;
    off: <E extends keyof Events>(event: E, listener: Events[E]) => TypedEmitter<Events>;
    private commandIdentifiers;
    constructor(options: Options);
    connect(): void;
    send(message: string, name?: string, identifier?: number): void;
    sendAndWait(message: string, name?: string, identifier?: number): Promise<Packet>;
    private generateRandomCommandId;
    private onConnect;
    private onError;
    private onClose;
    private onMessage;
    private processPacket;
}
