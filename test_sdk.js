const https = require('https');

const key = 'wtxazqsausnnusnlwatlxdwutkdznqhwnmec';
const url = `https://apis.mappls.com/advancedmaps/api/${key}/map_sdk?layer=vector&v=3.0`;

const options = {
  headers: {
    'Referer': 'https://pb08taxi.vercel.app/',
    'Origin': 'https://pb08taxi.vercel.app'
  }
};

https.get(url, options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    if(res.statusCode !== 200) console.log(`Response: ${data.slice(0, 500)}`);
    else console.log("SUCCESS!");
  });
}).on('error', (e) => {
  console.error(e);
});
