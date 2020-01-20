/**
 *  Storeon is a module to sync events through WebSocket
 *  @param {String} url Address of WebSocket server
 *  @param {Object} [options] Module configuration
 *  @param {String[]} [options.include] List of events to sync
 *  @param {String[]} [options.exclude] List of events to ignore
 *  @param {Number} [options.reconnectInterval] Time (ms) to reconnect
 *  @param {Number} [options.pingPongInterval] Interval (ms) to ping server
 **/
var ws = function (url, options) {
  options = options || {}
  var include = options.include
  var exclude = options.exclude
  var reconnectInterval = options.reconnectInterval || 500
  var pingPongInterval = options.pingPongInterval || 2000

  if (process.env.NODE_ENV === 'development') {
    if (!url) {
      throw new Error(
        'The url parameter should be a string. ' +
        'For example: "ws://localhost:8080"')
    }
  }

  return function (store) {
    var connection
    var reconnectTimer
    var pingPongTimer
    var pingPongAttempt = false
    var reconnectAttempt = false
    var fromWS = Symbol('ws')
    function reconnect () {
      if (reconnectAttempt) return
      clearTimeout(reconnectTimer)
      reconnectAttempt = true
      reconnectTimer = setTimeout(function () {
        start()
      }, reconnectInterval)
    }
    function message (event) {
      if (event.data === 'pong') {
        pingPongAttempt = false
        return
      }
      try {
        var receive = JSON.parse(event.data)
        receive.value = receive.value || {}
        if (include && include.indexOf(receive.event) === -1) return
        if (exclude && exclude.indexOf(receive.event) !== -1) return
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

    store.on('@dispatch', function (_, data) {
      if (
        (data[0] && data[0][0] === '@') ||
        (data[1] && data[1][fromWS]) ||
        (connection.readyState !== WebSocket.OPEN) ||
        (include && include.indexOf(data[0]) === -1) ||
        (exclude && exclude.indexOf(data[0]) !== -1)
      ) return

      connection.send(JSON.stringify({
        event: data[0],
        value: data[1]
      }))
    })
  }
}

module.exports = ws
