let WS = require('jest-websocket-mock')
let { createStoreon } = require('storeon')

let { websocket } = require('../')

let store
let counter
let fakeURL = 'ws://localhost:8080'

beforeEach(() => {
  counter = function (s) {
    s.on('@init', () => {
      return { a: 0, b: 0 }
    })

    s.on('counter/inc', state => {
      return {
        a: state.a + 1,
        b: state.b + 1
      }
    })
    s.on('counter/dec', state => {
      return {
        a: state.a - 1,
        b: state.b - 1
      }
    })
  }
})

afterEach(() => {
  process.env.NODE_ENV = 'development'
})

it('should throw not throw the error in not development mode', () => {
  process.env.NODE_ENV = 'production'
  expect(() => {
    createStoreon(websocket())
  }).toThrow('modules.forEach is not a function')
})

it('should throw the error', () => {
  expect(() => {
    createStoreon(websocket())
  }).toThrow('The url parameter should be a string. ' +
        'For example: "ws://localhost:8080"')
})

it('should send event to server', async () => {
  let server = new WS.WS(fakeURL)
  store = createStoreon([
    counter,
    websocket(fakeURL)
  ])
  await server.connected
  store.dispatch('counter/inc')
  await expect(server).toReceiveMessage('{"event":"counter/inc"}')
  server.close()
})

it('should not sending events if server get the error', async () => {
  let server = new WS.WS(fakeURL)
  store = createStoreon([
    counter,
    websocket(fakeURL)
  ])
  await server.connected

  store.dispatch('counter/inc')
  await expect(server).toReceiveMessage('{"event":"counter/inc"}')

  server.error()
  store.dispatch('counter/inc')
  expect(store.get()).toEqual({
    a: 2, b: 2
  })
})

it('should not sending events if server closes connection', async () => {
  let server = new WS.WS(fakeURL)
  store = createStoreon([
    counter,
    websocket(fakeURL)
  ])
  await server.connected

  store.dispatch('counter/inc')
  await expect(server).toReceiveMessage('{"event":"counter/inc"}')

  server.close()
  store.dispatch('counter/inc')
  expect(store.get()).toEqual({
    a: 2, b: 2
  })
})

it('should getting event from server', async () => {
  let server = new WS.WS(fakeURL)
  store = createStoreon([
    counter,
    websocket(fakeURL)
  ])
  await server.connected
  server.send('{"event":"counter/inc"}')
  expect(store.get()).toEqual({
    a: 1, b: 1
  })
  server.close()
})

it('should not change the state if server sends not exist event', async () => {
  let server = new WS.WS(fakeURL)
  store = createStoreon([
    counter,
    websocket(fakeURL)
  ])
  await server.connected
  server.send('{"event":"counter/remove"}')
  expect(store.get()).toEqual({
    a: 0, b: 0
  })
  server.close()
})

it('should do nothing if server send non valid json string', async () => {
  let server = new WS.WS(fakeURL)
  store = createStoreon([
    counter,
    websocket(fakeURL)
  ])
  await server.connected
  server.send('test string')
  expect(store.get()).toEqual({
    a: 0, b: 0
  })
  server.close()
})

it('should skip events not listed in include', async () => {
  let server = new WS.WS(fakeURL)
  let include = ['counter/dec']
  store = createStoreon([
    counter,
    websocket(fakeURL, { include })
  ])
  await server.connected

  store.dispatch('counter/inc')
  store.dispatch('counter/dec')
  await expect(server).not.toReceiveMessage('{"event":"counter/inc"}')

  server.close()
})

it('should dispatch events only if listed in include', async () => {
  let server = new WS.WS(fakeURL)
  let include = ['counter/inc']
  store = createStoreon([
    counter,
    websocket(fakeURL, { include })
  ])
  await server.connected

  server.send('{"event":"counter/inc"}')
  server.send('{"event":"counter/dec"}')
  expect(store.get()).toEqual({
    a: 1, b: 1
  })
  server.close()
})

it('should skip events if listed in exclude', async () => {
  let server = new WS.WS(fakeURL)
  let exclude = ['counter/inc']
  store = createStoreon([
    counter,
    websocket(fakeURL, { exclude })
  ])
  await server.connected

  store.dispatch('counter/inc')
  store.dispatch('counter/dec')
  await expect(server).not.toReceiveMessage('{"event":"counter/inc"}')

  server.close()
})

it('should dispatch events only if not listed in exclude', async () => {
  let server = new WS.WS(fakeURL)
  let exclude = ['counter/dec']
  store = createStoreon([
    counter,
    websocket(fakeURL, { exclude })
  ])
  await server.connected

  server.send('{"event":"counter/inc"}')
  server.send('{"event":"counter/dec"}')
  expect(store.get()).toEqual({
    a: 1, b: 1
  })
  server.close()
})

it('should dispatch all received events if include is empty', async () => {
  let server = new WS.WS(fakeURL)
  store = createStoreon([
    counter,
    websocket(fakeURL)
  ])
  await server.connected

  server.send('{"event":"counter/inc"}')
  server.send('{"event":"counter/dec"}')
  expect(store.get()).toEqual({
    a: 0, b: 0
  })
  server.close()
})

it('should send all received events if include is empty', async () => {
  let server = new WS.WS(fakeURL)
  store = createStoreon([
    counter,
    websocket(fakeURL)
  ])
  await server.connected

  store.dispatch('counter/inc')
  store.dispatch('counter/dec')
  await expect(server).toReceiveMessage('{"event":"counter/inc"}')
  await expect(server).toReceiveMessage('{"event":"counter/dec"}')
  server.close()
})

it('should send ping and get back pong', async () => {
  jest.useFakeTimers()
  let server = new WS.WS(fakeURL)
  let send = jest.spyOn(WebSocket.prototype, 'send')
  let listeners = { }
  jest.spyOn(WebSocket.prototype, 'addEventListener')
    .mockImplementation((type, callback) => {
      listeners[type] = callback
    })
  store = createStoreon([
    counter,
    websocket(fakeURL)
  ])
  jest.runOnlyPendingTimers()
  expect(send).toHaveBeenCalledWith('ping')
  listeners.message({ data: 'pong' })
  jest.runOnlyPendingTimers()
  expect(send).toHaveBeenCalledWith('ping')
  listeners.close()
  server.close()
})

it('should reconnect if not receiving pong', async () => {
  jest.useFakeTimers()
  let mock = jest.spyOn(global, 'WebSocket').mockImplementation(() => {
    return {
      addEventListener: jest.fn(),
      send: jest.fn()
    }
  })
  store = createStoreon([
    counter,
    websocket(fakeURL)
  ])
  expect(mock).toHaveBeenCalledTimes(1)
  jest.advanceTimersByTime(2000)
  expect(mock).toHaveBeenCalledTimes(2)
})

it('should reconnect if server send error', async () => {
  jest.useFakeTimers()
  jest.clearAllMocks()
  let listeners = { }
  let mock = jest.spyOn(global, 'WebSocket').mockImplementation(() => {
    return {
      addEventListener: (type, callback) => (listeners[type] = callback),
      send: jest.fn()
    }
  })
  store = createStoreon([
    counter,
    websocket(fakeURL)
  ])
  expect(mock).toHaveBeenCalledTimes(1)
  jest.advanceTimersByTime(500)
  listeners.error()
  jest.advanceTimersByTime(500)
  expect(mock).toHaveBeenCalledTimes(2)
})
