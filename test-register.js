const https = require('https');

const data = JSON.stringify({
  email: 'test@gestionasso.com',
  password: 'Test1234!',
  role: 'PRESIDENT',
  tenantId: 'testasso',
  associationNom: 'Association Test',
  associationSlug: 'testasso',
  associationDevise: 'FCFA',
  associationLangue: 'fr'
});

const options = {
  hostname: 'backend-gestion-association-production.up.railway.app',
  path: '/auth/register',
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
