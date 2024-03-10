
export interface Packet {
    id: number
    type: PacketType
    payload: string | object
}

export enum PacketType {
	error = 'Error',
	warning = 'Warning',
	generic = 'Generic',
	chat = 'Chat',
	report = 'Report'
}

export type Events = {
    connected: () => void,
    disconnected: (code: number, reason: string) => void,
    message: (packet: Packet) => void,
    error: (error: any) => void
}

export interface Options {

	/// RCON Host IP Address
	readonly host: string

    /// RCON Host port
    ///   @default: 25575
    readonly port?: number

    /// RCON Host password
    readonly password: string

    /// Maximum time for a packet to arrive before an error is thrown
    ///  @default: 2000 ms
    readonly timeout?: number,

    /// Maximum number of parallel requests. Most Rust servers can
    /// only reliably process one packet at a time.
    ///   @default: 1
    readonly maxPending?: number

    /// Packet sending timeout threshold
    readonly packetSendingTimeout?: number

}
