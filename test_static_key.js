const https = require('https');

const key = 'wtxazqsausnnusnlwatlxdwutkdznqhwnmec';

const endpoints = [
  {
    name: 'Bearer Token Auth',
    host: 'atlas.mappls.com',
    path: '/api/places/search/json?query=delhi',
    headers: { 'Authorization': `bearer ${key}` }
  },
  {
    name: 'Token without Bearer',
    host: 'atlas.mappls.com',
    path: '/api/places/search/json?query=delhi',
    headers: { 'Authorization': key }
  },
  {
    name: 'AdvancedMaps V1 REST Key',
    host: 'apis.mappls.com',
    path: `/advancedmaps/v1/${key}/route_adv/driving/77.2,28.5;77.2,28.6`,
    headers: {}
  },
  {
    name: 'Outpost Token generation (using key as both)',
    host: 'outpost.mapmyindia.com',
    path: '/api/security/oauth/token',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${key}&client_secret=${key}`
  }
];

function testEndpoint(ep) {
  return new Promise((resolve) => {
    const options = {
      hostname: ep.host,
      path: ep.path,
      method: ep.method || 'GET',
      headers: ep.headers
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`\n--- ${ep.name} ---`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}`);
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
