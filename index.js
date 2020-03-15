/**
 *  Storeon is a module to sync events through WebSocket
 *  @param {String} url Address of WebSocket server
 *  @param {Object} [options] Module configuration
 *  @param {String[]} [options.include] List of events to sync
 *  @param {String[]} [options.exclude] List of events to ignore
 *  @param {Number} [options.reconnectInterval] Time (ms) to reconnect
 *  @param {Number} [options.pingPongInterval] Interval (ms) to ping server
 **/
let ws = function (url, options) {
  options = options || {}
  let include = options.include
  let exclude = options.exclude
  let reconnectInterval = options.reconnectInterval || 500
  let pingPongInterval = options.pingPongInterval || 2000

  if (process.env.NODE_ENV === 'development') {
    if (!url) {
      throw new Error(
        'The url parameter should be a string. ' +
        'For example: "ws://localhost:8080"')
    }
  }

  return function (store) {
    let connection
    let reconnectTimer
    let pingPongTimer
    let pingPongAttempt = false
    let reconnectAttempt = false
    let fromWS = Symbol('ws')
    function reconnect () {
      if (reconnectAttempt) return
      clearTimeout(reconnectTimer)
      reconnectAttempt = true
      reconnectTimer = setTimeout(() => {
        start()
      }, reconnectInterval)
    }
    function message (event) {
      if (event.data === 'pong') {
        pingPongAttempt = false
        return
      }
      try {
        let receive = JSON.parse(event.data)
        receive.value = receive.value || {}
        if (include && !include.includes(receive.event)) return
        if (exclude && exclude.includes(receive.event)) return
        receive.value[fromWS] = true
        store.dispatch(receive.event, receive.value)
      } catch (e) {}
    }

    function pingPong () {
      if (!pingPongAttempt) {
        connection.send('ping')
      } else {
        start()
      }
      pingPongAttempt = !pingPongAttempt
    }

    function start () {
      clearInterval(pingPongTimer)
      clearTimeout(reconnectTimer)
      connection = new WebSocket(url)
      connection.addEventListener('close', reconnect)
      connection.addEventListener('error', reconnect)
      connection.addEventListener('message', message)
      pingPongTimer = setInterval(pingPong, pingPongInterval)
    }
    start()

    store.on('@dispatch', (_, data) => {
      if (
        (data[0] && data[0][0] === '@') ||
        (data[1] && data[1][fromWS]) ||
        (connection.readyState !== WebSocket.OPEN) ||
        (include && !include.includes(data[0])) ||
        (exclude && exclude.includes(data[0]))
      ) return

      connection.send(JSON.stringify({
        event: data[0],
        value: data[1]
      }))
    })
  }
}

module.exports = ws
