const { Client } = require('pg');
const bcrypt = require('bcrypt');

require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  console.log('Connecté à Supabase');

  // Créer le tenant
  const tenantId = 'demo';
  await client.query(`
    INSERT INTO tenants (id, nom, slug, devise, langue, "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `, [tenantId, 'Association Démo', 'demo', 'FCFA', 'fr']);

  // Hasher le mot de passe
  const password = await bcrypt.hash('Demo1234!', 10);

  // Créer l'utilisateur
  const result = await client.query(`
    INSERT INTO users (id, "tenantId", email, password, role, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
    ON CONFLICT ("tenantId", email) DO UPDATE SET password = $3
    RETURNING id, email, role, "tenantId"
  `, [tenantId, 'demo@gestionasso.com', password, 'PRESIDENT']);

  console.log('\n✅ Compte créé avec succès !');
  console.log('================================');
  console.log('URL      :', 'https://gestionassociations.netlify.app/login');
  console.log('Email    :', 'demo@gestionasso.com');
  console.log('Password :', 'Demo1234!');
  console.log('TenantId :', 'demo');
  console.log('================================');

  await client.end();
}

main().catch(console.error);
