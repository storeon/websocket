# Storeon websocket

<img src="https://storeon.github.io/storeon/logo.svg" align="right"
     alt="Storeon logo by Anton Lovchikov" width="160" height="142">

Tiny module for [Storeon] which is adding functionality to work with WebSocket. This means that now you can send and receive events by WebSocket.

It is just 411 bytes module (it uses [Size Limit] to control the size) without any dependencies.

[Storeon]: https://github.com/storeon/storeon
[Size Limit]: https://github.com/ai/size-limit

```js
import websocket from '@storeon/websocket'

const url = 'ws://localhost:8080'

const store = createStore([
  /* all your modules */
  websocket(url)
 ])

// now all dispatched events will be send to server with address ws://localhost:8080
```

![Example of using websocket events functionality](example.gif)

## Installation

```bash
npm install @storeon/websocket
# or
yarn add @storeon/websocket
```

## Usage

This module has two core functionality:

- sending all events to server
- receiving and dispatching events from server

### websocket(url, include, reconnectInterval, pingPongInterval)

First parameter is address of WebSocket server:
```js
type url = String
```

Second parameter is white list of events. 
All events added to this array will be dispatched/sent.

```js
type include = Void | Array<String>
```

If no pass the `include` then all events will be dispatched/sent.

Third parameter is after how many millisecond try reconnect again if connection is lost (default 500):
```js
type reconnectInterval = Void | Number
```

Fourth parameter is how often in millisecond module should check if connection is alive (default 2000):
```js
type pingPongInterval = Void | Number
```

Only `url` is not optional parameter.

### Server

The module is sending event like a string. So before sending it stringify all events.

After receiving message from server the module trying to parse this string to json with `JSON.parse`.
If received message is valid json then module dispatching it in `storeon`.

Each 2000 ms module send `ping` message to server and if server in 2000 ms doesn't send back message `pong`
then module trying to reconnect to server.

If server close connection or send error then module trying to reconnect to server.

Example implementation of echo server please see in [example](./test/demo/ws_server.js).

## LICENSE

MIT

## Acknowledgments

This module based on [redux-websocket](https://github.com/giantmachines/redux-websocket) repository.

