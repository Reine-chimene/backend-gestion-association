// Script pour créer une association de test
// Utilise le fetch global de Node.js

const API_URL = 'http://localhost:3001';

async function post(path, data) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response;
}

async function setupTestData() {
  try {
    console.log('1️⃣ Création de l\'association "Association Test"...');
    const registerRes = await post('/auth/register', {
      email: 'president@test.com',
      password: 'Test1234!',
      tenantId: 'test-tenant-001',
      role: 'PRESIDENT',
      associationNom: 'Association Test',
      associationSlug: 'association-test',
      associationDevise: 'FCFA',
      associationLangue: 'fr',
    });

    if (!registerRes.ok) {
      const err = await registerRes.json();
      console.error('Erreur inscription:', err.message || err);
      console.log('   (L\'utilisateur existe peut-être déjà)');
    } else {
      const registerData = await registerRes.json();
      console.log('✅ Association créée !');
      console.log('   Tenant ID: test-tenant-001');
      console.log('   User ID:', registerData.id);
    }

    // Connexion
    console.log('\n2️⃣ Connexion pour obtenir les tokens...');
    const loginRes = await post('/auth/login', {
      email: 'president@test.com',
      password: 'Test1234!',
      tenantId: 'test-tenant-001',
    });

    if (!loginRes.ok) {
      const err = await loginRes.json();
      console.error('❌ Erreur connexion:', err.message || err);
      return;
    }

    const loginData = await loginRes.json();
    const { user, accessToken, refreshToken } = loginData;
    console.log('✅ Connecté !');
    console.log('   User ID:', user.id);
    console.log('   Access Token:', accessToken.substring(0, 30) + '...');
    console.log('   Refresh Token:', refreshToken.substring(0, 30) + '...');

    // Créer un membre
    console.log('\n3️⃣ Création d\'un membre...');
    const membreData = {
      tenantId: 'test-tenant-001',
      // userId est optionnel, on peut le lier plus tard
      numeroMembre: 'MEM-001',
      nom: 'Dupont',
      prenom: 'Jean',
      telephone: '0123456789',
      email: 'jean.dupont@test.com',
    };

    const membreRes = await fetch(`${API_URL}/membres`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(membreData),
    });

    if (!membreRes.ok) {
      const err = await membreRes.json();
      console.log('⚠️  Endpoint /membres:', err.message || 'champs manquants ou endpoint non disponible');
    } else {
      const membre = await membreRes.json();
      console.log('✅ Membre créé !');
      console.log('   ID:', membre.id);
      console.log('   Nom:', membre.nom, membre.prenom);
    }

    console.log('\n🎉 SETUP TERMINÉ !');
    console.log('\n=== IDENTIFIANTS DE CONNEXION ===');
    console.log('Frontend: http://localhost:3000');
    console.log('Backend: http://localhost:3001');
    console.log('');
    console.log('📧 Email: president@test.com');
    console.log('🔑 Mot de passe: Test1234!');
    console.log('🏢 Tenant ID: test-tenant-001');
    console.log('\nUtilisez ces identifiants pour vous connecter sur le frontend.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

setupTestData();

