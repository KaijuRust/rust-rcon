
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

}
