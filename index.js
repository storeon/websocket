/**
 *  Storeon module to send and receive events by WebSocket
 *  @param {String} url The url of WebSocket server
 *  @param {String[]} include The array that descibed what event
 *      should be sent/dispatched
 *  @param {Number} reconnectInterval Interval after trying to reconnect
 *  @param {Number} pingPongInterval Interval to send 'ping' to server
 **/
var ws = function (url, include, reconnectInterval, pingPongInterval) {
  include = include || []
  reconnectInterval = reconnectInterval || 500
  pingPongInterval = pingPongInterval || 2000
  if (!url) {
    throw new Error(
      'The url parameter should be a string. ' +
      'For example: "ws://localhost:8080"')
  }

  return function (store) {
    var connection
    var isOpen = false
    var reconnectTimer
    var pingPongTimer
    var pingPongAttempt = false
    var reconnectAttempt = false
    var receivedEvent = Symbol('event_from_ws')
    function reconnect () {
      if (reconnectAttempt) return
      clearTimeout(reconnectTimer)
      reconnectAttempt = true
      reconnectTimer = setTimeout(function () {
        start()
      }, reconnectInterval)
    }
    function open () {
      isOpen = true
    }
    function close () {
      isOpen = false
      reconnect()
    }
    function message (event) {
      if (event.data === 'pong') {
        pingPongAttempt = false
        return
      }
      try {
        var receive = JSON.parse(event.data)
        receive.value = receive.value || {}
        if (include.length !== 0 &&
          include.indexOf(receive.event) === -1) return
        receive.value[receivedEvent] = true
        store.dispatch(receive.event, receive.value)
      } catch (e) {}
    }

    function pingPong () {
      if (!pingPongAttempt) {
        connection.send('ping')
        pingPongAttempt = true
      } else {
        pingPongAttempt = false
        start()
      }
    }

    function start () {
      clearInterval(pingPongTimer)
      clearTimeout(reconnectTimer)
      connection = new WebSocket(url)
      connection.addEventListener('open', open)
      connection.addEventListener('close', close)
      connection.addEventListener('error', close)
      connection.addEventListener('message', message)
      pingPongTimer = setInterval(pingPong, pingPongInterval)
    }
    start()

    store.on('@dispatch', function (_, data) {
      if (data[0] === '@changed' || !isOpen) return
      if (data[1] && data[1][receivedEvent]) return

      if (connection.readyState !== WebSocket.OPEN ||
        (include.length !== 0 && include.indexOf(data[0]) === -1)) return

      var toSend = {
        event: data[0],
        value: data[1]
      }
      connection.send(JSON.stringify(toSend))
    })
  }
}

module.exports = ws
