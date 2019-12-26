# Storeon websocket

<img src="https://storeon.github.io/storeon/logo.svg" align="right"
     alt="Storeon logo by Anton Lovchikov" width="160" height="142">

Tiny module for [Storeon] which is adding functionality to work with WebSocket. This means that now you can send and recive events by WebSocket.

It is just 275 bytes module (it uses [Size Limit] to control the size) without any dependencies.

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

```
npm install @storeon/websocket
```

## Usage

This module has two core functionality:

- sending all events to server
- reciving and dispatching events from server

## LICENSE

MIT

## Acknowledgments

This module based on [redux-websocket](https://github.com/giantmachines/redux-websocket) repository.

