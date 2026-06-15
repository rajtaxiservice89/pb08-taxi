const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: 'new'});
  const page = await browser.newPage();
  
  page.on('response', async response => {
    const url = response.url();
    if ((url.includes('mappls.com') || url.includes('mapmyindia.com')) && !url.includes('map_sdk')) {
       try {
         const text = await response.text();
         console.log('RESPONSE (' + url + '):', text.substring(0, 300));
       } catch(e) {}
    }
  });

  const html = `
    <html>
      <body>
        <input type="text" id="search" />
        <script src="https://apis.mappls.com/advancedmaps/api/qrkpbdnlfswstxxqusrwdtdpbgcwmhnwzars/map_sdk?layer=vector&v=3.0"></script>
        <script src="https://apis.mappls.com/advancedmaps/api/qrkpbdnlfswstxxqusrwdtdpbgcwmhnwzars/map_sdk_plugins?v=3.0&libraries=search"></script>
        <script>
          setTimeout(() => {
             new window.mappls.search(document.getElementById('search'), {}, (data) => {
                 console.log("MAAPLS_UI_DATA:" + JSON.stringify(data));
             });
          }, 2000);
        </script>
      </body>
    </html>
  `;
  
  await page.setContent(html);
  await new Promise(r => setTimeout(r, 4000));
  await page.type('#search', 'Delhi');
  await new Promise(r => setTimeout(r, 2000));
  await page.keyboard.press('ArrowDown');
  await new Promise(r => setTimeout(r, 500));
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 4000));
  await browser.close();
})();
