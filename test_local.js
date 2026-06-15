const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: 'new'});
  const page = await browser.newPage();
  
  page.on('console', msg => {
     if(msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });
  page.on('dialog', async dialog => {
      console.log('ALERT:', dialog.message());
      await dialog.accept();
  });

  console.log("Navigating to http://localhost:3000/booking...");
  await page.goto('http://localhost:3000/booking', {waitUntil: 'networkidle2'});
  
  // Wait for map script to load and initialize
  await new Promise(r => setTimeout(r, 5000));
  
  console.log("Typing 'New Krishna Sweet House' in destination...");
  await page.type('#destination', 'New Krishna Sweet House');
  
  // Wait for Mappls Autosuggest dropdown to appear
  await new Promise(r => setTimeout(r, 2000));
  
  // Press ArrowDown to select first suggestion, then Enter
  console.log("Selecting suggestion...");
  await page.keyboard.press('ArrowDown');
  await new Promise(r => setTimeout(r, 500));
  await page.keyboard.press('Enter');
  
  // Wait for callback to execute and state to update
  await new Promise(r => setTimeout(r, 3000));
  
  const destValue = await page.$eval('#destination', el => el.value);
  console.log("Final Destination Input Value:", destValue);
  
  await browser.close();
  console.log("Test finished.");
})();
