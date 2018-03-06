import * as path from 'path'
import * as fs from 'fs'
import axios from 'axios'
import scrape, { Article } from './scrape'
require('dotenv').config()

const outputPath = path.join('dist', 'pptv.json')

const timeout = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const waitSpan = 1000

const scrapeRecursive = async (page: string, lastId: string = '') => {
  console.log(`Scraping... ${page}`)
  const { articles, nextPage } = await scrape(page)

  const lastIdx = articles.findIndex((article) => article.id === lastId)

  if (lastIdx >= 0) return articles.slice(0, lastIdx)
  if (!nextPage) return articles

  await timeout(waitSpan)
  return [...articles, ...(await scrapeRecursive(nextPage, lastId))]
}

const main = async () => {
  let lastData = []

  if (!process.env.PPTV_IGNORE_CACHE) {
    try {
      lastData = (await axios.get(process.env.PPTV_CACHE_URL)).data
    } catch (err) {
      lastData = []
      console.log(err)
    }
  }

  const savedList = lastData as Article[]
  const lastId: string = savedList.length > 0 ? savedList[0].id : ''

  console.log('lastId: ', lastId)
  const list = await scrapeRecursive('1.htm', lastId)

  fs.writeFile(outputPath, JSON.stringify([...list, ...savedList]), (err) => {})
}

main()
