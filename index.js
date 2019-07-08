import express from 'express'
import http from 'http'
import fetch from 'node-fetch'
import utf8 from 'utf8'
import { exec } from 'child_process'
import { getGoogleTranslate } from './services.js'
import { getHuWordAnalysis } from './services.js'

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

const getMulti = async (req) => {
  // Parallel run kills the server with puppeteer, and also possibly triggers
  // Google Translate service temporary ban with the fetch method

  // return Promise.all([
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

  const en = await getGoogleTranslate('en', req.query.q)
  const sw = await getGoogleTranslate('sw', req.query.q)
  const hu = await getGoogleTranslate('hu', req.query.q)
  const sw2en = await getGoogleTranslate('en', sw)
  const hu2en = await getGoogleTranslate('en', hu)

  return { en, sw, hu, sw2en, hu2en }
}

app.get('/lang/googletranslate/multi', (req, res) => {
  getMulti(req)
  .then(JSON.stringify)
  .then(result => res.send(result))
})

app.get('/lang/hunmorph-foma', (req, res) => {
  hunmorphFomaAnalysis(req.query.q)
    .then(result => res.send(result))
})

app.get('/lang/hu/analysis', (req, res) => {
  const words = req.query.q.split(' ')
  Promise.all(
    words
      .map(getHuWordAnalysis)
  )
  .then(results => results.flat())
  .then(results => `<pre>${results.join('\n\n')}</pre>`)
  .then(result => res.send(result))
})

app.get('/lang/everything', (req, res) => {
  getMulti(req)
  .then(res => {
    const huWords = res.hu.split(' ')
      .map(word => word.replace(/[?!, ]|\n/g, '').trim())
      .filter(word => word)

    const huWordsAnalysisMap = huWords
      .reduce((cum, next) => ({ ...cum, [next]: hunmorphFomaAnalysis(next) }), {})

    return {
      ...res,
      huWords,
      huWordsAnalysisMap,
      huAnalysisText: huWords
        .map(word => huWordsAnalysisMap[word])
        .join('\n\n')
    }
  })
  .then(JSON.stringify)
  .then(result => res.send(result))
})
