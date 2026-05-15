import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Connexion...');

  // Créer le tenant demo
  const tenant = await prisma.tenant.upsert({
    where: { id: 'demo' },
    update: {},
    create: {
      id: 'demo',
      nom: 'Association Démo',
      slug: 'demo',
      devise: 'FCFA',
      langue: 'fr',
    },
  });
  console.log('Tenant créé:', tenant.id);

  // Créer l'utilisateur
  const password = await bcrypt.hash('Demo1234!', 10);
  const user = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: 'demo', email: 'demo@gestionasso.com' } },
    update: { password },
    create: {
      tenantId: 'demo',
      email: 'demo@gestionasso.com',
      password,
      role: 'PRESIDENT',
    },
  });

  console.log('\n✅ Compte créé !');
  console.log('URL      : https://gestionassociations.netlify.app/login');
  console.log('Email    : demo@gestionasso.com');
  console.log('Password : Demo1234!');
  console.log('TenantId : demo');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
