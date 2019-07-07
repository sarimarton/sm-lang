import express from 'express'
import http from 'http'
import fetch from 'node-fetch'
import utf8 from 'utf8'
import { exec } from 'child_process'

const app = express()

http.createServer(app).listen(3000)

const getGoogleTranslate = (tl, q) =>
  fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${q}`)
    .then(res => res.text())
    .then(txt => { try { return utf8.decode(txt) } catch { return txt } })
    .then(JSON.parse)
    .then(result => result[0][0][0])


app.get('/', (req, res) => {
  res.send(
`<pre>
    Services:

    google translate:                                     /lang/googletranslate?tl={target language}&q={query}
    google multi translate (en, sw, hu, sw2en, hu2en):    /lang/googletranslate/multi?q={query}
    hungarian word analysis:                              /lang/hunmorph-foma?q={word}
</pre>`)
})

app.get('/lang/googletranslate', (req, res) => {
  getGoogleTranslate(req.query.tl, req.query.q)
    .then(result => res.send(result))
})

app.get('/lang/googletranslate/multi', (req, res) => {
  Promise.all([
    getGoogleTranslate('en', req.query.q),
    getGoogleTranslate('sw', req.query.q),
    getGoogleTranslate('hu', req.query.q),
  ])
  .then(([en, sw, hu]) =>
    Promise.all([
      en, sw, hu,
      getGoogleTranslate('en', sw),
      getGoogleTranslate('en', hu),
    ])
  )
  .then(([en, sw, hu, sw2en, hu2en]) => ({ en, sw, hu, sw2en, hu2en }))
  .then(JSON.stringify)
  .then(result => res.send(result))
})

app.get('/lang/hunmorph-foma', (req, res) => {
  const child = exec(`echo ${req.query.q} | ./deps/foma-0.9.18/flookup ./deps/hunmorph-foma/hunfnnum.fst`,
    (error, stdout, stderr) => {
      res.send(stdout)
  })
})
