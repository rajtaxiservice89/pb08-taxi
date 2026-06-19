const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    console.log("Navigating...");
    await page.goto('http://localhost:3000/booking', { waitUntil: 'networkidle2' });
    
    await new Promise(r => setTimeout(r, 2000));
    
    const result = await page.evaluate(async () => {
      try {
         await new Promise(r => setTimeout(r, 2000));
         let mapInst = window.mapInstance.current;
         if (!mapInst) return "No map div";
         
         return {
           hasAddSource: typeof mapInst.addSource === 'function',
           hasAddLayer: typeof mapInst.addLayer === 'function',
           hasFitBounds: typeof mapInst.fitBounds === 'function'
         };
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
