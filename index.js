import express from 'express'
import http from 'http'
import fetch from 'node-fetch'
import utf8 from 'utf8'
import { exec } from 'child_process'
import { getGoogleTranslate } from './services.js'
import { hunmorphFomaAnalysis } from './services.js'

const app = express()

http.createServer(app).listen(3000)

app.get('/', (req, res) => {
  res.send(
`<pre>
    Services:

    google translate:                                     /lang/googletranslate?tl={target language}&q={query}
    google multi translate (en, sw, hu, sw2en, hu2en):    /lang/googletranslate/multi?q={query}
    hungarian word analysis:                              /lang/hu/wordanalysis?q={word}
    -------
    everything combined:                                  /lang/everything?q={query}
</pre>`)
})

app.get('/lang/googletranslate', (req, res) => {
  getGoogleTranslate(req.query.tl, req.query.q)
    .then(result => res.send(result))
})

app.get('/lang/googletranslate/multi', (req, res) => {
  Promise.resolve()
    .then(res => ({ en: getGoogleTranslate('en', req.query.q) }))
    .then(res => ({ sw: getGoogleTranslate('sw', req.query.q), ...res }))
    .then(res => ({ hu: getGoogleTranslate('hu', req.query.q), ...res }))
    .then(res => ({ sw2en: getGoogleTranslate('en', res.sw), ...res }))
    .then(res => ({ hu2en: getGoogleTranslate('en', res.hu), ...res }))

  // Promise.all([
  //   getGoogleTranslate('en', req.query.q),
  //   getGoogleTranslate('sw', req.query.q),
  //   getGoogleTranslate('hu', req.query.q),
  // ])
  // .then(([en, sw, hu]) =>
  //   Promise.all([
  //     en, sw, hu,
  //     getGoogleTranslate('en', sw),
  //     getGoogleTranslate('en', hu),
  //   ])
  // )
  // .then(([en, sw, hu, sw2en, hu2en]) => ({ en, sw, hu, sw2en, hu2en }))

  .then(JSON.stringify)
  .then(result => res.send(result))
})

app.get('/lang/hunmorph-foma', (req, res) => {
  hunmorphFomaAnalysis(req.query.q)
    .then(result => res.send(result))
})

app.get('/lang/hu/wordanalysis', (req, res) => {
  req.url = '/lang/hunmorph-foma'
  app.handle(req, res)
})

app.get('/lang/everything', (req, res) => {
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
      Promise.all(
        hu.split(' ')
        .map(word => word.replace(/[?!, ]|\n/g, '').trim())
        .filter(word => word)
        .map(hunmorphFomaAnalysis)
      )
    ])
  )
  .then(([en, sw, hu, sw2en, hu2en, huWords]) => ({
    en, sw, hu, sw2en, hu2en, huWords
  }))
  .then(JSON.stringify)
  .then(result => res.send(result))
})
