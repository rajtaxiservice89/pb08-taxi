const puppeteer = require('puppeteer');
(async () => {
  console.log("Starting test on pb08taxi.vercel.app/booking...");
  const browser = await puppeteer.launch({headless: 'new'});
  const page = await browser.newPage();
  
  // Listen to console to see any errors
  page.on('console', msg => {
      if(msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });
  
  // Also listen for alerts
  page.on('dialog', async dialog => {
      console.log('ALERT:', dialog.message());
      await dialog.accept();
  });

  await page.goto('https://pb08taxi.vercel.app/booking', {waitUntil: 'networkidle2'});
  
  console.log("Typing 'New Krishna Sweet House' in destination...");
  await page.waitForSelector('#destination');
  await page.type('#destination', 'New Krishna Sweet House');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Pressing ArrowDown and Enter...");
  await page.keyboard.press('ArrowDown');
  await new Promise(r => setTimeout(r, 500));
  await page.keyboard.press('Enter');
  
  await new Promise(r => setTimeout(r, 4000));
  console.log("Checking if map center updated or destination is set...");
  
  const destValue = await page.$eval('#destination', el => el.value);
  console.log("Destination Input Value:", destValue);
  
  await browser.close();
  console.log("Test finished.");
})();
