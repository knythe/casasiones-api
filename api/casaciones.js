import puppeteer from 'puppeteer';

export default async function handler(req, res) {
  const pageNumber = parseInt(req.query.page) || 1;
  const url = pageNumber === 1
    ? 'https://lpderecho.pe/category/jurisprudencia/casacion/'
    : `https://lpderecho.pe/category/jurisprudencia/casacion/page/${pageNumber}/`;

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const results = await page.evaluate(() => {
      const articles = [];
      document.querySelectorAll('.td_module_3.td_module_wrap').forEach((el) => {
        const anchor = el.querySelector('h3.entry-title a');
        const img = el.querySelector('.td-module-thumb img');
        const author = el.querySelector('.td-post-author-name a');
        const date = el.querySelector('time');

        if (anchor) {
          articles.push({
            title: anchor.getAttribute('title') || anchor.textContent.trim(),
            link: anchor.href,
            image: img ? img.src : null,
            author: author ? author.textContent.trim() : null,
            date: date ? date.textContent.trim() : null
          });
        }
      });
      return articles;
    });

    await browser.close();
    res.status(200).json(results.slice(0, 5));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error scraping casaciones' });
  }
}
