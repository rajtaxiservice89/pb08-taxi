const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => {
      console.log(`[PAGE LOG] ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      console.log(`[PAGE ERROR] ${error.message}`);
    });

    console.log("Navigating...");
    await page.goto('http://localhost:3000/booking', { waitUntil: 'networkidle2' });
    
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("Evaluating script...");
    const result = await page.evaluate(async () => {
      try {
         // wait for mappls to load
         await new Promise(r => setTimeout(r, 2000));
         let mapInst = document.querySelector('#mainMap');
         if (!mapInst) return "No map div";
         
         if (!window.mappls) return "window.mappls is not loaded";
         if (!window.mappls.Polyline) return "window.mappls.Polyline is undefined";
         
         return "mappls.Polyline exists!";
      } catch (e) {
         return "ERROR: " + e.message;
      }
    });
    
    console.log("Result: ", result);
    await browser.close();
  } catch(e) {
    console.error(e);
  }
})();
