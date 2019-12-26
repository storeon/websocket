var ws = function (url) {
  if (!url) {
    throw new Error(
      'The url parameter should be a string. ' +
      'For example: "ws://localhost:8080"')
  }

  var connection = new WebSocket(url)
  var isOpen = false
  return function (store) {
    var ignoreNext = false

    connection.addEventListener('open', function () {
      isOpen = true
    })
    connection.addEventListener('close', function () {
      isOpen = false
    })
    connection.addEventListener('error', function () {
      isOpen = false
    })
    connection.addEventListener('message', function (event) {
      try {
        var recive = JSON.parse(event.data)
        ignoreNext = true
        store.dispatch(recive.event, recive.value)
      } catch (e) {}
    })

    store.on('@dispatch', function (_, data) {
      if (data[0] === '@changed' || !isOpen) return

      if (ignoreNext) {
        ignoreNext = false
        return
      }

      if (connection.readyState === WebSocket.OPEN) {
        var toSend = {
          event: data[0],
          value: data[1]
        }
        connection.send(JSON.stringify(toSend))
      }
    })
  }
}

module.exports = ws
