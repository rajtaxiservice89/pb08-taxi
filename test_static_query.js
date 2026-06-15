const https = require('https');

const key = 'wtxazqsausnnusnlwatlxdwutkdznqhwnmec';

const endpoints = [
  {
    name: 'atlas.mappls.com with access_token param',
    host: 'atlas.mappls.com',
    path: `/api/places/search/json?query=delhi&access_token=${key}`,
  },
  {
    name: 'apis.mappls.com with key param',
    host: 'apis.mappls.com',
    path: `/advancedmaps/v1/${key}/geo_code?addr=delhi`,
  },
  {
    name: 'atlas.mapmyindia.com with access_token param',
    host: 'atlas.mapmyindia.com',
    path: `/api/places/search/json?query=delhi&access_token=${key}`,
  }
];

function testEndpoint(ep) {
  return new Promise((resolve) => {
    const options = {
      hostname: ep.host,
      path: ep.path,
      method: ep.method || 'GET',
      headers: ep.headers || {}
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`\n--- ${ep.name} ---`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data.slice(0, 300)}`);
        resolve();
      });
    });
    
    req.on('error', (e) => {
      console.log(`\n--- ${ep.name} ---`);
      console.log(`Error: ${e.message}`);
      resolve();
    });
    
    if (ep.body) req.write(ep.body);
    req.end();
  });
}

async function runAll() {
  for (const ep of endpoints) {
    await testEndpoint(ep);
  }
}

runAll();
