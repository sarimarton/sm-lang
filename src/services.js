import utf8 from 'utf8'
import { execSync } from 'child_process'
// import puppeteer from 'puppeteer'
import _ from 'lodash'

// const browser = puppeteer.launch({
//   args: ['--no-sandbox']
// })

const pages = []

const getGoogleTranslatePage = async function (pageIdx) {
  // if (!pages[pageIdx]) {
  //   pages[pageIdx] = {
  //     page: await (await browser).newPage(),
  //     ts: new Date()
  //   }
  //   await pages[pageIdx].page.setViewport({ width: 500, height: 500 })
  //   await pages[pageIdx].page.goto('https://translate.google.com/')
  // }

  // if (new Date() - pages[pageIdx].ts > 1e3 * 60 * 60 * 24) {
  //   pages[pageIdx].ts = new Date()
  //   await pages[pageIdx].page.reload()
  // }

  // return pages[pageIdx].page
}

export const getSourceLang = q =>
  /[öüóőúéáűíÖÜÓŐÚÉÁŰÍ]/.test(q) ? 'hu' : 'auto'


export const getGoogleTranslateJson = async ({ tl, q, sl, pageIdx }) => {

  const _sl = sl || getSourceLang(q)

  const page = await getGoogleTranslatePage(pageIdx || 0)
  const pageObj = pages[pageIdx || 0]

  if (JSON.stringify({ tl, q, sl }) === pageObj.lastKey) {
    return pageObj.lastResult
  }
  pageObj.lastKey = JSON.stringify({ tl, q, sl })

  const info = await new Promise(resolve => {
    const responseListener = async response => {
      if (response.url().startsWith('https://translate.google.com/translate_a/single')) {
        // console.log('response', tl, sl, pageIdx)
        page.removeListener('response', responseListener)
        pageObj.lastResult = JSON.parse(await response.text())
        resolve(JSON.parse(await response.text()))
      }
    }

    page.on('response', responseListener)
    // console.log('request', `https://translate.google.com/#view=home&op=translate&sl=${_sl}&tl=${tl}&text=${q}`)
    page.goto(`https://translate.google.com/#view=home&op=translate&sl=${_sl}&tl=${tl}&text=${q}`)
  })

  return info
}

export const getGoogleTranslate = async ({ tl, q, sl, pageIdx }) => {
  return (await getGoogleTranslateJson({ tl, q, sl, pageIdx }))
    [0]
    .map(res => res[0]).join('')
}

export const getHunmorphFomaAnalysis = word => {
  const escaped = word.toLowerCase().replace(/(['"])/g, '\\$1')

  return (
    execSync(
      `echo ${escaped} | ./foma/foma/flookup ./hunmorph-foma/hunfnnum.fst`,
      { encoding: 'utf8' }
    )
    .trim()
  )
}

const fomaToGoogleWordClassMap = {
  'Noun': 'noun',
  'Verb': 'verb',
  'Adv': 'adverb',
  'Adj': 'adjective',
  'Neg': 'particle',
  'Num': ''
}

const fomaRE =
  /^(?<input>.*?)\t(?:\+(?<pref>Pref)\+)?(?<stem>[^+]+)\+(?<wclass>[^+]+)(?:\+(?<parts>(?:[^+]+(?:\+|$))+))?/

export const getHuWordAnalysis = async word => {
  const fomaResults = getHunmorphFomaAnalysis(word)
    .split('\n')

  const results = []

  for (let fomaResult of fomaResults) {
    const matches = fomaResult.match(fomaRE)
    if (!matches) {
      continue
    }
    const { input, pref, stem, wclass, parts } = matches.groups
    const fomaParts = (parts || '')
      .split('+')
      .filter(part => part && (part !== 'Nom'))

    const json = await getGoogleTranslateJson({ sl: 'hu', tl: 'en', q: stem })
    const translations =
      _.compact(
        _.chain(json)
          .get(1)
          .filter(([gWordClass]) => fomaToGoogleWordClassMap[wclass] === gWordClass)
          .get('0.1')
          .value()
        ||
        _.castArray(_.get(json, '0.0.0'))
      )

    results.push({
      word,
      pref,
      stem,
      wclass,
      translations,
      fomaParts
    })
  }

  return results
}
