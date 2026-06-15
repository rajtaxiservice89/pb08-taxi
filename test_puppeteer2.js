const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: 'new'});
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  const html = `
    <html>
      <body>
        <script src="https://apis.mappls.com/advancedmaps/api/qrkpbdnlfswstxxqusrwdtdpbgcwmhnwzars/map_sdk_plugins?v=3.0&libraries=search"></script>
        <script>
          setTimeout(() => {
             console.log("Calling mappls.search programmatically...");
             try {
               new mappls.search("Delhi", {}, (data) => {
                   console.log("MAAPLS_DATA:" + JSON.stringify(data));
               });
             } catch(e) {
                 console.log("ERROR: " + e.message);
             }
          }, 2000);
        </script>
      </body>
    </html>
  `;
  
  await page.setContent(html);
  await new Promise(r => setTimeout(r, 6000));
  await browser.close();
})();
