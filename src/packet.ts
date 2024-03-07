

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
