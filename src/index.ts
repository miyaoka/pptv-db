import * as admin from 'firebase-admin'
import scrape from './scrape'
require('dotenv').config()

const timeout = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.PROJECT_ID,
    clientEmail: process.env.CLIENT_EMAIL,
    privateKey: process.env.PRIVATE_KEY
  }),
  databaseURL: process.env.DATABASE_URL
})

const db = admin.firestore()
const waitSpan = 1000

const scrapeRecursive = async (page: string) => {
  console.log(`Scraping... ${page}`)
  const { articles, nextPage } = await scrape(page)

  let batch = db.batch()
  articles.forEach((article) => {
    batch.set(db.collection('articles').doc(article.id), article)
  })

  batch
    .commit()
    .then((result) => {
      console.log(`-> Document successfully written! ${page}`)
    })
    .catch((error) => {
      console.error('-> Error writing document: ', error)
    })

  if (!nextPage) return

  await timeout(waitSpan)
  scrapeRecursive(nextPage)
}

scrapeRecursive('1.htm')
