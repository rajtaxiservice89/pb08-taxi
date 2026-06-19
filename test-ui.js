const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Catch console logs
    page.on('console', msg => {
      console.log(`[PAGE LOG ${msg.type()}] ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      console.log(`[PAGE ERROR] ${error.message}`);
    });
    
    page.on('requestfailed', request => {
      console.log(`[NETWORK ERROR] ${request.url()} - ${request.failure()?.errorText}`);
    });

    console.log("Navigating to http://localhost:3000/booking ...");
    await page.goto('http://localhost:3000/booking', { waitUntil: 'networkidle2' });
    
    console.log("Typing 'Current Location' into pickup...");
    await page.type('#pickup', 'Jalandhar');
    await page.waitForTimeout(2000);
    
    // Press down arrow and enter to select first autocomplete result
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    console.log("Typing 'Rama Mandi' into destination...");
    await page.type('#destination', 'Rama Mandi');
    await page.waitForTimeout(2000);
    
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000); // Wait for routing
    
    console.log("Done testing. Check logs above.");
    await browser.close();
  } catch(e) {
    console.error(e);
  }
})();
