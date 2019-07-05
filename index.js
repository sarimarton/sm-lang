import express from 'express'
import http from 'http'
import fetch from 'node-fetch'
import utf8 from 'utf8'
import { exec } from 'child_process'

const app = express()

http.createServer(app).listen(3000)

app.use(express.static('static'))

app.get('/', (req, res) => {
  res.send(
`<pre>
    Services:

    google translate:        /lang/googletranslate?tl={target language}&q={query}
    hungarian word analysis: /lang/hunmorph-foma?q={word}
</pre>`)
})

app.get('/lang/googletranslate', (req, res) => {
  const utf8Decode = txt => {
    try { return utf8.decode(txt) } catch { return txt }
  }

  fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${req.query.tl}&dt=t&q=${req.query.q}`)
    .then(res => res.text())
    .then(utf8Decode)
    .then(JSON.parse)
    .then(result => {
      res.send(result[0][0][0])
    })
})

app.get('/lang/hunmorph-foma', (req, res) => {
  const child = exec(`echo ${req.query.q} | ./deps/foma-0.9.18/flookup ./deps/hunmorph-foma/hunfnnum.fst`,
    (error, stdout, stderr) => {
      res.send(stdout)
  })
})
