import fetch from 'node-fetch'
import utf8 from 'utf8'
import { exec, execSync } from 'child_process'
import puppeteer from 'puppeteer'
import stripHtml from 'string-strip-html'

const browser = puppeteer.launch({
  args: ['--no-sandbox']
})

const getGoogleTranslatePage = (function() {
  let page
  let lastTs = new Date()

  return async function () {
    if (!page) {
      page = await (await browser).newPage()
      await page.setViewport({ width: 500, height: 500 })
      await page.goto('https://translate.google.com/')
    }

    if (new Date() - lastTs > 1e3 * 60 * 60 * 24) {
      lastTs = new Date()
      await page.reload()
    }

    return page
  }
})()

export const getSourceLang = q => {
  if (/[öüóőúéáűíÖÜÓŐÚÉÁŰÍ]/.test(q)) {
    return 'hu'
  } else {
    return 'auto'
  }
}

export const getGoogleTranslate = async (tl, q) => {
  const sl = getSourceLang(q)

  const page = await getGoogleTranslatePage()

  const info = await new Promise(resolve => {
    const responseListener = async response => {
      if (response.url().startsWith('https://translate.google.com/translate_a/single')) {
        page.removeListener('response', responseListener);
        const responseJson = JSON.parse(await response.text())
        resolve(responseJson[0].map(res => res[0]).join(''))
      }
    }

    page.on('response', responseListener);
    page.goto(`https://translate.google.com/#view=home&op=translate&sl=${sl}&tl=${tl}&text=${q}`)
  })

  return info
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
