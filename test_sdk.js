const https = require('https');

const key = 'wtxazqsausnnusnlwatlxdwutkdznqhwnmec';

const req = https.get(`https://apis.mappls.com/advancedmaps/api/${key}/map_sdk?layer=vector&v=3.0`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response length: ${data.length}`);
    if (res.statusCode !== 200) {
      console.log(`Response body: ${data.slice(0, 500)}`);
    } else {
      console.log(`Looks like JS code downloaded successfully! Starts with: ${data.slice(0, 100)}`);
    }
  });
});

req.on('error', e => console.error(e));
