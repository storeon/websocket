import { StoreonModule } from 'storeon';

/**
 *  Storeon is a module to sync events through WebSocket
 *  @param {String} url Address of WebSocket server
 *  @param {Object} [options] Module configuration
 *  @param {String[]} [options.include] List of events to sync
 *  @param {String[]} [options.exclude] List of events to ignore
 *  @param {Number} [options.reconnectInterval] Time (ms) to reconnect
 *  @param {Number} [options.pingPongInterval] Interval (ms) to ping server
 **/
declare function websocket<State>(
    url: string,
    options?: {
        include?: String[],
        exclude?: String[],
        reconnectInterval?: Number,
        pingPongInterval?: Number
    }
): StoreonModule<State>;

export = { websocket };
