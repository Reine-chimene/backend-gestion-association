const https = require('https');

// Test login - si DB connectée on aura 401, si pas connectée on aura 500
const data = JSON.stringify({
  email: 'test@test.com',
  password: 'test',
  tenantId: 'test'
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
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
    if (res.statusCode === 401 || res.statusCode === 400) {
      console.log('\n✅ BASE DE DONNÉES CONNECTÉE ! (erreur auth normale)');
    } else if (res.statusCode === 500) {
      console.log('\n❌ BASE DE DONNÉES NON CONNECTÉE - DATABASE_URL manquante sur Railway');
    }
  });
});

req.on('error', e => console.error('Erreur réseau:', e.message));
req.write(data);
req.end();
