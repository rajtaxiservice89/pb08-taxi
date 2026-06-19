const puppeteer = require('puppeteer');
(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  console.log('Navigating to live vercel app...');
  await page.goto('https://pb08taxi.vercel.app/booking', { waitUntil: 'networkidle2', timeout: 30000 });
  
  console.log('Waiting for Mappls direction plugin inputs...');
  try {
     await page.waitForSelector('#DrS_mainMap', { timeout: 15000 });
     
     console.log('Typing pickup...');
     await page.focus('#DrS_mainMap');
     await page.keyboard.type('Jalandhar City Railway Station');
     await page.keyboard.press('Enter');
     await new Promise(r => setTimeout(r, 4000));
     
     console.log('Typing destination...');
     await page.focus('#DrE_mainMap');
     await page.keyboard.type('Model Town Market, Jalandhar');
     await page.keyboard.press('Enter');
     await new Promise(r => setTimeout(r, 8000)); // Wait longer for Mappls API and Fare React effect
     
     console.log('Checking for fare box...');
     const fareData = await page.evaluate(() => {
         const distEl = document.evaluate("//p[contains(text(), 'Total Distance')]/following-sibling::p", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
         const fareEl = document.evaluate("//p[contains(text(), 'Estimated Fare')]/following-sibling::p", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
         
         const walkingIconHidden = document.querySelector('.direction-profile') ? window.getComputedStyle(document.querySelector('.direction-profile')).display === 'none' : true;
         
         return {
             distance: distEl ? distEl.innerText : 'Not found',
             fare: fareEl ? fareEl.innerText : 'Not found',
             isWalkingIconHidden: walkingIconHidden
         };
     });
     
     console.log('TEST RESULT:', fareData);
  } catch (e) {
     console.error('Error during test:', e);
  }
  
  await browser.close();
})();
