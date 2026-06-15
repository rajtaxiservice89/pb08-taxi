const https = require('https');

const key = 'wtxazqsausnnusnlwatlxdwutkdznqhwnmec';

const req = https.get(`https://apis.mappls.com/advancedmaps/v1/${key}/rev_geocode?lat=28.544&lng=77.26`, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response: ${data}`);
  });
});

req.on('error', (e) => {
  console.error(e);
});
