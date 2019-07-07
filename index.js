import express from 'express'
import http from 'http'
import fetch from 'node-fetch'
import utf8 from 'utf8'
import { exec } from 'child_process'

const app = express()

http.createServer(app).listen(3000)

const getGoogleTranslateFetch = (tl, q) =>
  fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${q}`)
  // fetch(`https://translate.google.hu/translate_a/single?client=webapp&sl=auto&tl=${tl}&hl=en&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&dt=gt&source=bh&ssel=0&tsel=0&kc=1&tk=942168.589626&q=${q}`)
    .then(res => res.text())
    .then(txt => { try { return utf8.decode(txt) } catch { return txt } })
    .then(txt => { try { return JSON.parse(txt)[0][0][0] } catch { return 'Error' } })

const getGoogleTranslateCurl = (tl, q) =>
  new Promise(resolve => {
    exec(
      `curl 'https://translate.google.hu/translate_a/single?client=webapp&sl=auto&tl=en&hl=en&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&dt=gt&source=bh&ssel=0&tsel=0&kc=1&tk=942168.589626&q=Marci%20vagyok' -H 'pragma: no-cache' -H 'cookie: SID=egVXzVuZ2iU7QJNyy-MuCgyeO3ViLbrPLFxc10w226ZuIuO0DvTeyRHxo4ixeu0HzmX_QA.; HSID=Afd8bg2x2p_VhsA0f; SSID=AgVjQZZ5VMHJfWFA3; APISID=HigVtnxVLjJVKZkc/Ac2F6PYQMfN7LpMDh; SAPISID=5XdXKVZ5P1ksOwaa/AJe76nn6F4Z2mSki3; _ga=GA1.3.58620073.1562466680; _gid=GA1.3.1894007278.1562466680; 1P_JAR=2019-7-7-2; NID=187=A9QzdrCi67JL49q_EEk3F7hBqDrQ8F-A-SoOyWr0-iGCXrqfM_TfjJ8c0EBSOf5kdItQR7OXHNYTJ1ymDf_RjO7qzIcbkwk45JF7Rz2sGQ81iU3-Wc8I-ZOHratTnvarqWcM_kLo6uh7SEm4X0uVfys82Vq3crN9KImjsDE1BeI3GK82E1u-SY-dPVR-eUQrZYg6RgANiMQSc_A6qPmDHZmwH-_uwxRfpKSlYR46zjM6D-EF9c2leCZNa4n3J6k4knH5NhHi9rxvgoyEGpiEegbfS0h9ttbG4Q' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: hu-HU,hu;q=0.9,en-US;q=0.8,en;q=0.7' -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36' -H 'accept: */*' -H 'cache-control: no-cache' -H 'authority: translate.google.hu' -H 'referer: https://translate.google.hu/' -H 'x-client-data: CIm2yQEIprbJAQjEtskBCKmdygEIqKPKAQixp8oBCOKoygEI8anKAQiXrcoBCLutygEIzK3KAQjurcoBCLqvygE=' --compressed`,
      (error, stdout, stderr) => {
        console.log('stdout', stdout)
        console.log('stderr', stderr)
        resolve('this is not yet working')
      }
    )
  })

const getGoogleTranslate = getGoogleTranslateFetch

app.get('/', (req, res) => {
  res.send(
`<pre>
    Services:

    google translate:                                     /lang/googletranslate?tl={target language}&q={query}
    google multi translate (en, sw, hu, sw2en, hu2en):    /lang/googletranslate/multi?q={query}
    hungarian word analysis:                              /lang/hu/wordanalysis?q={word}
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

app.get('/lang/hu/wordanalysis', (req, res) => {
  req.url = '/lang/hunmorph-foma'
  app.handle(req, res)
})
