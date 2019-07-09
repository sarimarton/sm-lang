import utf8 from 'utf8'
import { exec, execSync } from 'child_process'
import puppeteer from 'puppeteer'
import _ from 'lodash'

const browser = puppeteer.launch({
  args: ['--no-sandbox']
})

const pages = []

const getGoogleTranslatePage = async function (pageIdx) {
  if (!pages[pageIdx]) {
    pages[pageIdx] = {
      page: await (await browser).newPage(),
      ts: new Date()
    }
    await pages[pageIdx].page.setViewport({ width: 500, height: 500 })
    await pages[pageIdx].page.goto('https://translate.google.com/')
  }

  if (new Date() - pages[pageIdx].ts > 1e3 * 60 * 60 * 24) {
    pages[pageIdx].ts = new Date()
    await pages[pageIdx].page.reload()
  }

  return pages[pageIdx].page
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
        page.removeListener('response', responseListener)
        pageObj.lastResult = JSON.parse(await response.text())
        resolve(JSON.parse(await response.text()))
      }
    }

    page.on('response', responseListener)
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

  return execSync(
      `echo ${escaped} | ./deps/foma/flookup ./deps/hunmorph-foma/hunfnnum.fst`,
      { encoding: 'utf8' }
    )
    .replace(/\n+$/g, '')
    .replace(/\t+/g, ': ')
    .split('\n')
}

const fomaToGoogleWordClassMap = {
  'Noun': 'noun',
  'Verb': 'verb',
  'Adv': 'adverb',
  'Neg': 'particle'
}

export const getHuWordAnalysis = async word => {
  const fomaResults = getHunmorphFomaAnalysis(word)

  let result = `${word} =\n`

  for (let fomaResult of fomaResults) {
    const stem = fomaResult.replace(/.*?:\s+([^+]+).*/, '$1')
    const fomaParts = fomaResult.replace(/.*?:\s+[^+]+(.*)/, '$1')
      .split('+')
      .slice(1)

    const wordClass = fomaParts[0]

    const translations =
      _.chain(await getGoogleTranslateJson({ sl: 'hu', tl: 'en', q: stem }))
        .get(1)
        .filter(([wClass, engTranslations]) => fomaToGoogleWordClassMap[wordClass] === wClass)
        .get('0.1')
        .value()
        || []

    result +=
      `${stem} [${wordClass}]; ${translations.join(', ')}` +
      `${['', ...fomaParts.slice(1)].join('\n + ')}\n`
  }

  return result
}
