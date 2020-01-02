import createStore from 'storeon'

/**
 *  Storeon module to send and receive events by WebSocket
 *  @param {String} url The url of WebSocket server
 *  @param {String[]} include The array that described what event
 *      should be sent/dispatched
 *  @param {Number} reconnectInterval Interval after trying to reconnect
 *  @param {Number} pingPongInterval Interval to send 'ping' to server
 **/
function websocket<State>(
    url: string,
    include?: String[],
    reconnectInterval?: Number,
    pingPongInterval?: Number
): createStore.Module<State>

export = websocket;
