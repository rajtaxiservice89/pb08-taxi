const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: 'new'});
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  const html = `
    <html>
      <body>
        <input type="text" id="search" />
        <script src="https://apis.mappls.com/advancedmaps/api/qrkpbdnlfswstxxqusrwdtdpbgcwmhnwzars/map_sdk_plugins?v=3.0&libraries=search"></script>
        <script>
          setTimeout(() => {
             console.log("Initializing Mappls Search");
             new mappls.search(document.getElementById('search'), {}, (data) => {
                 console.log("MAAPLS_DATA:" + JSON.stringify(data));
             });
          }, 2000);
        </script>
      </body>
    </html>
  `;
  
  await page.setContent(html);
  await new Promise(r => setTimeout(r, 4000));
  console.log("Typing Delhi...");
  await page.type('#search', 'Delhi');
  await new Promise(r => setTimeout(r, 3000));
  console.log("Pressing down arrow...");
  await page.keyboard.press('ArrowDown');
  await new Promise(r => setTimeout(r, 1000));
  console.log("Pressing enter...");
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
})();
