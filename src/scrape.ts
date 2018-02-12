const scrapeIt = require('scrape-it')
const axios = require('axios')
const { Iconv } = require('iconv')

const baseUrl = 'http://portal.nifty.com/cs/dpztv/list/'

const parse = (html) => {
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

const scrape = async (page: string) => {
  try {
    // Convert s-jis to utf-8
    const res = await axios.get(`${baseUrl}${page}`, { responseType: 'arraybuffer' })
    const iconv = new Iconv('CP932', 'UTF-8')
    const html = iconv.convert(new Buffer(res.data, 'binary')).toString('utf8')

    const { articles, nextPage } = parse(html)

    return {
      articles: articles.map((article) => ({
        ...article,
        id: article.url.split('/').slice(-2, -1)[0]
      })),
      nextPage
    }
  } catch (error) {
    console.log(error)
  }
}

export default scrape
