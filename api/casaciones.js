import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  const pageNumber = parseInt(req.query.page) || 1;
  const url = pageNumber === 1
    ? 'https://lpderecho.pe/category/jurisprudencia/casacion/'
    : `https://lpderecho.pe/category/jurisprudencia/casacion/page/${pageNumber}/`;

  let browser = null;

  try {
    console.log('🚀 Lanzando navegador...');
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless
    });

    console.log('🌐 Abriendo nueva página...');
    const page = await browser.newPage();

    console.log(`🔗 Navegando a: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

    console.log('🔍 Ejecutando scraping...');
    const results = await page.evaluate(() => {
      const articles = [];
      const nodes = document.querySelectorAll('.td_module_3.td_module_wrap');
      if (nodes.length === 0) {
        throw new Error('⚠️ No se encontraron artículos');
      }

      nodes.forEach((el) => {
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

    console.log('✅ Scraping exitoso');
    res.status(200).json(results.slice(0, 5));
  } catch (error) {
    console.error('❌ Error al hacer scraping:', error);
    res.status(500).json({ error: 'Error scraping casaciones' });
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}
