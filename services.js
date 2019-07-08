import fetch from 'node-fetch'
import utf8 from 'utf8'
import { exec, execSync } from 'child_process'
import puppeteer from 'puppeteer'
import stripHtml from 'string-strip-html'

export const getGoogleTranslateFetch = (tl, q) =>
  // Uppercase accentuated letters cause problems here
  fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${q.toLowerCase()}`)
    .then(res => res.text())
    .then(txt => { try { return utf8.decode(txt) } catch { return txt } })
    .then(txt => { try { return JSON.parse(txt)[0][0][0] } catch { throw 'Google Translate Fetch Error' }})

export const getGoogleTranslatePuppeteer = async (tl, q) => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox']
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 1800 })
  await page.goto(`https://translate.google.com/#view=home&op=translate&sl=auto&tl=${tl}&text=${q}`)

  let info = undefined

  while (info == undefined) {
    try {
      info = await page.$eval('.translation', el => el.textContent)
    } catch {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  await browser.close()

  return info
}

export const getGoogleTranslate = (tl, q) => {
  return getGoogleTranslateFetch(tl, q)
    .catch(() => getGoogleTranslatePuppeteer(tl, q))
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

export const getHuWordAnalysis = word => {
  const fomaResults = getHunmorphFomaAnalysis(word)

  return Promise.all(
    fomaResults.map(async fomaResult => {
      const stem = fomaResult.replace(/.*?:\s+([^+]+).*/, '$1')
      const fomaParts = fomaResult.replace(/.*?:\s+[^+]+(.*)/, '$1')
        .split('+')
        .slice(1)

      const wordClass = fomaParts[0]

      const browseDictCCResult =
        await
          fetch(`https://browse.dict.cc/hungarian-english/${stem}.html`)
            .then(res => res.text())

      const translations =
        browseDictCCResult.includes('Sorry! Expression could not be found!')
          ? ['<translation not found>']
          : stripHtml(
              (browseDictCCResult.match(/<dd>(?:.|\n)*?<\/dd>/) || [''])[0]
              .replace(/<br>/g, '\n')
            )
            .split('\n')

      return `${word} =\n` +
        `${stem} [${wordClass}]; ${translations.join(', ')}` +
        `${['', ...fomaParts.slice(1)].join('\n + ')}\n`
    })
  )
}
