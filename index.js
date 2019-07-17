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
  await en = getGoogleTranslate({ tl: 'en', q: req.query.q })
  await sw = getGoogleTranslate({ tl: 'sw', q: req.query.q })
  await hu = getGoogleTranslate({ tl: 'hu', q: req.query.q })
  await sw2en = getGoogleTranslate({ sl: 'sw', tl: 'en', q: req.query.q })
  await hu2en = getGoogleTranslate({ sl: 'hu', tl: 'en', q: req.query.q })

  // const [en, sw, hu, sw2en, hu2en] =
  //   await Promise.all([
  //     getGoogleTranslate({ tl: 'en', q: req.query.q, pageIdx: 0 }),
  //     getGoogleTranslate({ tl: 'sw', q: req.query.q, pageIdx: 1 }),
  //     getGoogleTranslate({ tl: 'hu', q: req.query.q, pageIdx: 2 }),
  //   ])
  //   .then(([en, sw, hu]) =>
  //     Promise.all([
  //       en, sw, hu,
  //       getGoogleTranslate({ sl: 'sw', tl: 'en', q: sw, pageIdx: 0 }),
  //       getGoogleTranslate({ sl: 'hu', tl: 'en', q: hu, pageIdx: 1 })
  //     ])
  //   )

  return { en, sw, hu, sw2en, hu2en }
}

const getWords = (text) => {
  return text
    .split(' ')
    .map(word => word.replace(/[?!, ]|\n/g, '').trim())
    .filter(word => word)
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

  if (req.query.format === 'list') {
    const result = {
      prompt: req.query.q,
      list: {}
    }

    let entryIdx = 0

    for (let word of words) {
      const analyses = await getHuWordAnalysis(word)

      for (let [idx, res] of analyses.entries()) {
        const key = word + ''.padEnd(idx)

        result.list[`${entryIdx}-key`] = key
        result.list[`${entryIdx}-val`] = _.chain([
            res.pref,
            `${res.stem} ${res.wclass.toUpperCase()} "${res.translations.slice(0, 2).join(', ')}"`,
            ...res.fomaParts
          ])
          .compact()
          .map(part => `[${part}]`)
          .join(' + ')
          .value()

        entryIdx += 1
      }
    }

    const lastIdx = entryIdx - 1

    while (entryIdx < 32) {
      result.list[`${entryIdx}-key`] = result.list[`${lastIdx}-key`]
      result.list[`${entryIdx}-val`] = result.list[`${lastIdx}-val`]
      entryIdx += 1
    }

    res.send(`<pre>${JSON.stringify(result, null, 2)}</pre>`)
    return;
  }

  const results = []

  for (let word of words) {
    const analyses = await getHuWordAnalysis(word)

    results.push(
      `${word} =\n` +
      analyses.
        map(res =>
          `${res.pref ? ('  + ' + res.pref + '\n') : ''}` +
          `  ${res.stem} [${res.wclass}]; ${res.translations.slice(0, 2).join(', ')}` +
          `${res.fomaParts.length ? ['', ...res.fomaParts].join('\n  + ') : ''}\n`
        )
      .join('  -----------\n')
    )
  }

  res.send(`<pre>${results.join('\n')}</pre>`)
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
