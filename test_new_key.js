const https = require('https');

const key = 'qrkpbdnlfswstxxqusrwdtdpbgcwmhnwzars';
const url = `https://apis.mappls.com/advancedmaps/api/${key}/map_sdk?layer=vector&v=3.0`;

const options = {
  headers: {
    'Referer': 'https://pb08taxi.vercel.app/'
  }
};

https.get(url, options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
    if (res.statusCode !== 200) {
      console.log('Response:', data);
    } else {
      console.log('Response: (Success) Starts with:', data.substring(0, 100));
    }
  });
}).on('error', (e) => {
  console.error(e);
});
