"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function showData() {
    try {
        console.log('\n=== ASSOCIATIONS (Tenants) ===');
        const tenants = await prisma.tenant.findMany();
        if (tenants.length === 0) {
            console.log('Aucune association trouvée');
        }
        else {
            tenants.forEach(t => console.log(`ID: ${t.id}, Nom: ${t.nom}, Slug: ${t.slug}, Actif: ${t.actif}`));
        }
        console.log('\n=== UTILISATEURS ===');
        const users = await prisma.user.findMany({
            include: { membre: true },
        });
        if (users.length === 0) {
            console.log('Aucun utilisateur trouvé');
        }
        else {
            users.forEach(u => console.log(`ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, Tenant: ${u.tenantId}, Membre: ${u.membre?.nom || 'N/A'} ${u.membre?.prenom || ''}`));
        }
        console.log('\n=== MEMBRES ===');
        const membres = await prisma.membre.findMany({
            take: 10,
        });
        if (membres.length === 0) {
            console.log('Aucun membre trouvé');
        }
        else {
            membres.forEach(m => console.log(`ID: ${m.id}, Nom: ${m.nom} ${m.prenom}, Telephone: ${m.telephone}, Tenant: ${m.tenantId}`));
        }
    }
    catch (error) {
        console.error('Erreur:', error instanceof Error ? error.message : error);
    }
    finally {
        await prisma.$disconnect();
    }
}
showData();
//# sourceMappingURL=show-data.js.map