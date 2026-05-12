const https = require('https');

const data = JSON.stringify({
  email: 'reinetontsa965@gmail.com',
  password: 'Instagramm1$237',
  tenantId: 'sig'
});

const options = {
  hostname: 'backend-gestion-association-production.up.railway.app',
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();
