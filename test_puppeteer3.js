const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: 'new'});
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  const html = `
    <html>
      <body>
        <input type="text" id="search" />
        <script src="https://apis.mappls.com/advancedmaps/api/qrkpbdnlfswstxxqusrwdtdpbgcwmhnwzars/map_sdk?layer=vector&v=3.0&callback=initMap1"></script>
        <script src="https://apis.mappls.com/advancedmaps/api/qrkpbdnlfswstxxqusrwdtdpbgcwmhnwzars/map_sdk_plugins?v=3.0&libraries=search"></script>
        <script>
          setTimeout(() => {
             console.log("Calling mappls.search programmatically...");
             try {
               new mappls.search("Delhi", {}, (data) => {
                   console.log("MAAPLS_PROG_DATA:" + JSON.stringify(data));
               });
             } catch(e) {
                 console.log("PROG_ERROR: " + e.message);
             }

             console.log("Calling mappls.search UI...");
             try {
               new mappls.search(document.getElementById('search'), {}, (data) => {
                   console.log("MAAPLS_UI_DATA:" + JSON.stringify(data));
               });
             } catch(e) {
                 console.log("UI_ERROR: " + e.message);
             }
          }, 3000);
        </script>
      </body>
    </html>
  `;
  
  await page.setContent(html);
  await new Promise(r => setTimeout(r, 6000));
  console.log("Typing Noida...");
  await page.type('#search', 'Noida');
  await new Promise(r => setTimeout(r, 4000));
  await page.keyboard.press('ArrowDown');
  await new Promise(r => setTimeout(r, 1000));
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
})();
