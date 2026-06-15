const https = require('https');

const postData = JSON.stringify({
  username: 'rajtaxiservice89@gmail.com',
  password: 'Jio_mayra143'
});

const options = {
  hostname: 'auth.mappls.com',
  path: '/api/v1/auth/login', // guessing the endpoint
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Login Status:', res.statusCode);
    console.log('Login Response:', data);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(postData);
req.end();
