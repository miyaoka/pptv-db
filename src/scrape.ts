const scrapeIt = require('scrape-it')
const axios = require('axios')
const { Iconv } = require('iconv')

const baseUrl = 'http://portal.nifty.com'

export interface Article {
  date: number
  thumbnail: string
  url: string
  title: string
  author: string
  desc: string
  id: string
}

const parseList = (html): { articles: Article[]; nextPage: string } => {
  return scrapeIt.scrapeHTML(html, {
    articles: {
      listItem: '#mainContents div[align="center"] > table',
      data: {
        date: {
          selector: 'font',
          convert: (text) => {
            const date = text.replace(/\[(.+)\]/, '$1').split('.')
            return new Date(date[0], date[1], date[2]).getTime()
          }
        },
        thumbnail: {
          selector: 'img',
          attr: 'src'
        },
        url: {
          selector: 'a',
          attr: 'href'
        },
        title: 'a',
        author: {
          selector: 'td:last-child span:first-child',
          convert: (text) => text.replace(/^(?:.|\s)+?\( (.+) \)/, '$1')
        },
        desc: 'td:last-child span:last-child'
      }
    },
    nextPage: {
      selector: '#mainContents td[width="50%"]:last-child b + a',
      attr: 'href'
    }
  })
}

const scrapeUrl = async (url: string): Promise<string> => {
  try {
    // Convert s-jis to utf-8
    const res = await axios.get(url, { responseType: 'arraybuffer' })
    const iconv = new Iconv('CP932', 'UTF-8')
    return iconv.convert(new Buffer(res.data, 'binary')).toString('utf8')
  } catch (error) {
    console.log(error)
  }
}

const scrape = async (page: string): Promise<{ articles: Article[]; nextPage: string }> => {
  const html = await scrapeUrl(`${baseUrl}/cs/dpztv/list/${page}`)
  const { articles, nextPage } = parseList(html)

  return {
    articles: articles.map((article) => ({
      ...article,
      id: article.url.split('/').slice(-2, -1)[0]
    })),
    nextPage
  }
}

export default scrape
