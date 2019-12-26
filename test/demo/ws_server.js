const WebSocket = require('ws')
const nanoid = require('nanoid')
const chalk = require('chalk')

const wss = new WebSocket.Server({ port: 8080, clientTracking: true })
console.log(
  chalk.yellowBright('Server on port 8080 is listening (press Ctrl+C to exit)')
)
console.log(chalk.whiteBright('ws://localhost:8080'))
console.log('')
wss.on('connection', ws => {
  let id = nanoid(5)
  ws.id = id
  console.log(
    chalk.yellowBright('Client connected. Generate id:'), chalk.green(id)
  )
  ws.on('message', data => {
    console.log(chalk.yellowBright('Message: '))
    console.log(chalk.green(data))
    console.log(chalk.yellowBright('from client with id:'), chalk.green(id))
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client.id !== id) {
        console.log(
          chalk.yellowBright('Send this message to client:'),
          chalk.green(client.id)
        )
        client.send(data)
      }
    })
  })
})
