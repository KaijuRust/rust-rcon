export interface Options {
    readonly host: string;
    readonly port?: number;
    readonly password: string;
    readonly timeout?: number;
    readonly maxPending?: number;
}
