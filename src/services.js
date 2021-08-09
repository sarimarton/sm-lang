import utf8 from 'utf8'
import { execSync } from 'child_process'
import _ from 'lodash'

export const getSourceLang = q =>
  /[öüóőúéáűíÖÜÓŐÚÉÁŰÍ]/.test(q) ? 'hu' : ''

export const getGoogleTranslate = async ({ tl, q, sl }) => {
  return (
    execSync(
      `translate-shell "--brief ${sl || ''}:${tl || ''} '${q}'"`,
      { encoding: 'utf8' }
    )
    .trim()
  )
}

export const getHunmorphFomaAnalysis = word => {
  const escaped = word.toLowerCase().replace(/(['"])/g, '\\$1')

  return (
    execSync(
      `hunmorph-foma ${escaped}`,
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

    const translations = [await getGoogleTranslate({ sl: 'hu', tl: 'en', q: stem })]

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
