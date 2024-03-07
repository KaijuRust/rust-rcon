import WebSocket from "ws";
import EventEmitter from "events"
import TypedEmitter from "typed-emitter"

import { Options } from "./options"
import { Events } from "./events"
import { Packet, PacketType } from "./packet"

const RCON_RANGE_MIN = 1337000000;
const RCON_RANGE_MAX = 1337999999;

export class Client {

	readonly options: Options

	private webSocket?: WebSocket

	private emitter = new EventEmitter() as TypedEmitter<Events>
	public on = this.emitter.on.bind(this.emitter)
	public once = this.emitter.once.bind(this.emitter)
	public off = this.emitter.removeListener.bind(this.emitter)

	private commandIdentifiers: number[] = []

	// MARK: - Constructor

	public constructor(options: Options) {
		this.options = options
	}

	// MARK: - Connection

	public connect() {
		this.webSocket = new WebSocket(
			`ws://${this.options.host}:${this.options.port}/${this.options.password}`
		);

		this.webSocket.on('open', (e: any) => {
			this.onConnect(e)
		})

		this.webSocket.on('close', (code: any, reason: any) => {
			this.onClose(code, reason)
		})

		this.webSocket.on('error', (e: any) => {
			this.onError(e)
		})

		this.webSocket.on('message', (data) => {
			this.onMessage(data)
		})
	}

	// MARK: - Messages

	public send(message: string, name?: string, identifier?: number) {
		let commandIdentifier = identifier ? identifier : this.generateRandomCommandId()

		this.webSocket?.send(JSON.stringify({
			Identifier: commandIdentifier,
			Message: message,
			Name: name
		}));
	}

	public sendAndWait(message: string, name?: string, identifier?: number): Promise<Packet> {
		let commandIdentifier = identifier ? identifier : this.generateRandomCommandId()
		this.commandIdentifiers.push(commandIdentifier);

		this.send(message, name, commandIdentifier)

		return new Promise((resolve, reject) => {
			const commandResponseCallback = (serializedData: any) => {
				const data = JSON.parse(serializedData);
				let packet = this.processPacket(data)
				if (!packet)
					return reject("Failed to process packet")

				if (packet.type === PacketType.generic && packet.id === commandIdentifier) {
					this.webSocket?.removeEventListener('message', commandResponseCallback);
					this.commandIdentifiers.splice(this.commandIdentifiers.indexOf(commandIdentifier));

					this.emitter.emit('message', packet)
                    return resolve(packet)
                }
            }

			let timeout = this.options.packetSendingTimeout ?? 5000 // Default: 5 seconds
			setTimeout(() => {
				this.webSocket?.removeEventListener('message', commandResponseCallback);
                return reject(`${message} didn't return a response`);
            }, timeout);

            this.webSocket?.on('message', commandResponseCallback);
		})
	}

	private generateRandomCommandId() {
        return Math.floor(Math.random() * (RCON_RANGE_MAX - RCON_RANGE_MIN)) + RCON_RANGE_MIN;
    }


	// MARK: - Events

	private onConnect(event: any) {
		this.emitter.emit("connected")
	}

	private onError(error: Error) {
		this.emitter.emit("error", error);
	}

	private onClose(code: number, reason: string) {
		this.emitter.emit("disconnected", code, reason);
	}

	private onMessage(serializedData: any) {
		let data = JSON.parse(serializedData);
		if (data) {
			let packet = this.processPacket(data)
			if (packet) {
				this.emitter.emit('message', packet)
			} else {
				console.log("\t|=>" + `Failed to process packet, ${data.Message}`)
			}
		} else {
			console.log(`ERROR ERROR onMessage called and failed to parse object, Data: ${serializedData}`)
		}
	}

	// MARK: - Packet processing

	private processPacket(data: any): Packet | undefined {
		let identifier = parseInt(data.Identifier)
		switch (data.Type) {
			case PacketType.error:
			return {
				id: identifier,
				type: PacketType.error,
				payload: data.Message
			}

			case PacketType.warning:
				return {
					id: identifier,
					type: PacketType.warning,
					payload: data.Message
				}

			case PacketType.generic:
				let content;
				try {
					content = JSON.parse(data.Message)
				} catch {
					content = data.Message
				}

				return {
					id: identifier,
					type: PacketType.generic,
					payload: content
				}

			case PacketType.chat:
				return {
					id: identifier,
					type: PacketType.chat,
					payload: JSON.parse(data.Message)
				}

			case PacketType.report:
				return {
					id: identifier,
					type: PacketType.report,
					payload: JSON.parse(data.Message)
				}

			default:
				console.log("\t|=>" + `Unknown packet type, ${data.Type}`)
				return
		}
	}

}
