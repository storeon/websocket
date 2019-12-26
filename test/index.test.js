let WS = require('jest-websocket-mock')
let createStore = require('storeon')

let websocket = require('../')

global.WebSocket = WebSocket

let store
let counter
let fakeURL = 'ws://localhost:8080'

beforeEach(() => {
  counter = function (s) {
    s.on('@init', () => {
      return { a: 0, b: 0 }
    })

    s.on('counter/add', state => {
      return {
        a: state.a + 1,
        b: state.b + 1
      }
    })
  }
})

it('should throw the error', () => {
  expect(() => {
    createStore(websocket())
  }).toThrow('The url parameter should be a string. ' +
        'For example: "ws://localhost:8080"')
})

it('should send event to server', async () => {
  let server = new WS.WS(fakeURL)
  store = createStore([
    counter,
    websocket(fakeURL)
  ])
  await server.connected
  store.dispatch('counter/add')
  await expect(server).toReceiveMessage('{"event":"counter/add"}')
  server.close()
})

it('should not sending events if server get the error', async () => {
  let server = new WS.WS(fakeURL)
  store = createStore([
    counter,
    websocket(fakeURL)
  ])
  await server.connected

  store.dispatch('counter/add')
  await expect(server).toReceiveMessage('{"event":"counter/add"}')

  server.error()
  store.dispatch('counter/add')
  expect(store.get()).toEqual({
    a: 2, b: 2
  })
})

it('should not sending events if server closes connection', async () => {
  let server = new WS.WS(fakeURL)
  store = createStore([
    counter,
    websocket(fakeURL)
  ])
  await server.connected

  store.dispatch('counter/add')
  await expect(server).toReceiveMessage('{"event":"counter/add"}')

  server.close()
  store.dispatch('counter/add')
  expect(store.get()).toEqual({
    a: 2, b: 2
  })
})

it('should getting event from server', async () => {
  let server = new WS.WS(fakeURL)
  store = createStore([
    counter,
    websocket(fakeURL)
  ])
  await server.connected
  server.send('{"event":"counter/add"}')
  expect(store.get()).toEqual({
    a: 1, b: 1
  })
  server.close()
})

it('should not change the state if server sends not exist event', async () => {
  let server = new WS.WS(fakeURL)
  store = createStore([
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
