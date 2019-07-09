import express from 'express'
import http from 'http'
import _ from 'lodash'
import { getGoogleTranslate } from './services.js'
import { getHuWordAnalysis } from './services.js'
import { getHunmorphFomaAnalysis } from './services.js'

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
  getGoogleTranslate({ tl: req.query.tl, q: req.query.q })
    .then(result => res.send(result))
})

const getMulti = async (req) => {
  const [en, sw, hu, sw2en, hu2en] =
    await Promise.all([
      getGoogleTranslate({ tl: 'en', q: req.query.q, pageIdx: 0 }),
      getGoogleTranslate({ tl: 'sw', q: req.query.q, pageIdx: 1 }),
      getGoogleTranslate({ tl: 'hu', q: req.query.q, pageIdx: 2 }),
    ])
    .then(([en, sw, hu]) =>
      Promise.all([
        en, sw, hu,
        getGoogleTranslate({ sl: 'sw', tl: 'en', q: sw, pageIdx: 0 }),
        getGoogleTranslate({ sl: 'hu', tl: 'en', q: hu, pageIdx: 1 })
      ])
    )

  return { en, sw, hu, sw2en, hu2en }
}

const getWords = (text) => {
  return text
    .split(' ')
    .map(word => word.replace(/[?!, ]|\n/g, '').trim())
    .filter(word => word)
}

const pad = (req, text) => {
  if (req.query.pad) {
    const width = 100
    return text
      .split('\n')
      .map(line => line.padEnd(width) + '.')
      .join('\n')
  }

  return text
}

app.get('/lang/googletranslate/multi', (req, res) => {
  getMulti(req)
  .then(JSON.stringify)
  .then(result => res.send(result))
})

app.get('/lang/hunmorph-foma', (req, res) => {
  Promise.resolve(getHunmorphFomaAnalysis(req.query.q))
    .then(result => res.send(result))
})

app.get('/lang/hu/analysis', async (req, res) => {
  const words = getWords(req.query.q)

  const results = []

  for (let word of words) {
    results.push(await getHuWordAnalysis(word))
  }

  res.send(pad(req, `<pre>${results.join('\n')}</pre>`))
})

app.get('/lang/everything', (req, res) => {
  getMulti(req)
  .then(res => {
    const huWords = getWords(res.hu)

    const huWordsAnalysisMap = huWords
      .reduce((cum, next) => ({ ...cum, [next]: getHunmorphFomaAnalysis(next) }), {})

    return {
      ...res,
      huWords,
      huWordsAnalysisMap,
      huAnalysisText: huWords
        .map(word => huWordsAnalysisMap[word])
        .join('\n\n')
    }
  })
  .then(result => `<pre>${JSON.stringify(result, null, 2)}</pre>`)
  .then(result => res.send(result))
})
