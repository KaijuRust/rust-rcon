import { Packet } from './packet'

export type Events = {

    connected: () => void,
    disconnected: (code: number, reason: string) => void,

    message: (packet: Packet) => void,

    error: (error: any) => void

}
