import express from 'express'
import http from 'http'
import fetch from 'node-fetch'

const app = express()

http.createServer(app).listen(3000)

app.use(express.static('static'))

app.get('/hello', (req, res) => {
  res.send('Hello World 4!')
})

app.get('/lang/googletranslate', (req, res) => {
  res.send(JSON.parse(req.query).q)
  // fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${req.query.tl}&dt=t&q=${req.query.q}`)
  //   .then(res => res.text())
  //   .then(body => {
  //     res.send(body)
  //   })
})
