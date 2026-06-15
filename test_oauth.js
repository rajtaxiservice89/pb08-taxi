const https = require('https');

const clientId = 'qrkpbdnlfswstxxqusrwdtdpbgcwmhnwzars';
const clientSecret = 'dummy_secret';

const postData = new URLSearchParams({
  grant_type: 'client_credentials',
  client_id: clientId,
  client_secret: clientSecret
}).toString();

const options = {
  hostname: 'outpost.mapmyindia.com',
  path: '/api/security/oauth/token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': postData.length
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(postData);
req.end();
