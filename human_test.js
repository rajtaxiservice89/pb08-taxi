const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  try {
     console.log('Navigating to live vercel app...');
     await page.goto('https://pb08taxi.vercel.app/booking', { waitUntil: 'networkidle2', timeout: 30000 });
     
     console.log('Waiting for Mappls direction plugin...');
     await page.waitForSelector('#DrS_mainMap', { timeout: 15000 });
     
     console.log('Filling out human details...');
     await page.type('#customerName', 'Human Demo Ride', { delay: 50 });
     await page.type('#customerPhone', '9988776655', { delay: 50 });
     await page.type('#notes', 'This is a live E2E test via Puppeteer acting as a human user.', { delay: 20 });
     
     console.log('Typing pickup...');
     await page.focus('#DrS_mainMap');
     await page.keyboard.type('Jalandhar City Railway Station', { delay: 50 });
     await new Promise(r => setTimeout(r, 2000));
     await page.keyboard.press('ArrowDown');
     await page.keyboard.press('Enter');
     
     console.log('Typing destination...');
     await page.focus('#DrE_mainMap');
     await page.keyboard.type('Model Town Market, Jalandhar', { delay: 50 });
     await new Promise(r => setTimeout(r, 2000));
     await page.keyboard.press('ArrowDown');
     await page.keyboard.press('Enter');
     
     console.log('Waiting for route to draw and fare to calculate...');
     await new Promise(r => setTimeout(r, 6000));
     
     // Optional: Check if fare box appeared before clicking
     await page.screenshot({ path: 'vercel_before_submit.png', fullPage: true });
     
     console.log('Clicking Confirm Booking button...');
     await page.click('button[type="submit"]');
     
     console.log('Waiting for Success screen...');
     await page.waitForFunction(
         () => document.body.innerText.includes('Booking Confirmed!'),
         { timeout: 15000 }
     );
     
     console.log('Taking success screenshot...');
     await page.screenshot({ path: 'vercel_success_human.png', fullPage: true });
     console.log('SUCCESS! Human-like booking completed.');
  } catch (e) {
     console.error('Error during human E2E test:', e);
     await page.screenshot({ path: 'vercel_error_human.png', fullPage: true });
  }
  
  await browser.close();
})();
