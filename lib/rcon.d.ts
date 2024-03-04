import { Options } from "./options";
export declare class RCON {
    readonly options: Options;
    private webSocket?;
    private emitter;
    constructor(options: Options);
    connect(): void;
    private onConnect;
    private onError;
    private onClose;
    private onMessage;
}
