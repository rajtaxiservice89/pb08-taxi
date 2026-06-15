const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('LOG:', msg.text()));
    page.on('pageerror', err => console.log('ERROR:', err.message));
    
    await page.goto(`file://${path.join(__dirname, 'test-mappls.html')}`);
    
    // Wait until 'SUCCESS' is logged or 10 seconds pass
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await browser.close();
  } catch (err) {
    console.error("Puppeteer Failed:", err);
  }
})();
