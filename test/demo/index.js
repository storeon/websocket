let useCallback = require('react').useCallback
let Fragment = require('react').Fragment
let render = require('react-dom').render
let h = require('react').createElement
let { StoreContext, connectStoreon } = require('storeon/react')
let { createStoreon } = require('storeon')
let { storeonLogger, storeonDevtools } = require('storeon/devtools')

let { websocket } = require('../../')
let url = 'ws://localhost:8080'

function counter (store) {
  store.on('@init', () => {
    return {
      count1: 0,
      count2: 0
    }
  })
  store.on('inc', state => {
    return {
      count1: state.count1 + 1,
      count2: state.count2 + 1
    }
  })
}

function Tracker (props) {
  let hue = Math.round(255 * Math.random())
  let style = { backgroundColor: 'hsla(' + hue + ', 50%, 50%, 0.2)' }
  return h('div', { className: 'tracker', style }, props.value)
}

function Button (props) {
  let onClick = useCallback(() => {
    props.dispatch(props.event)
  })
  return h('button', { onClick, className: 'action' }, props.text)
}

let Tracker1 = connectStoreon('count1', props => {
  return h(Tracker, {
    value: 'Counter 1: ' + props.count1
  })
})

let Button1 = connectStoreon(props => {
  return h(Button, {
    dispatch: props.dispatch,
    event: 'inc',
    text: 'Increase counter'
  })
})

function App () {
  return h(
    Fragment,
    null,
    h('div', null, 'All dispatched events will be sent to server'),
    h('div', { className: 'container' }, h(Tracker1)),
    h('div', { className: 'buttons' }, h(Button1))
  )
}

let store = createStoreon([
  counter,
  websocket(url),
  storeonLogger,
  storeonDevtools()
])

render(
  h(StoreContext.Provider, { value: store }, h(App)),
  document.querySelector('main')
)
