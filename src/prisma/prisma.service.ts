import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Construire DATABASE_URL depuis les variables séparées si disponibles
    const dbUrl = process.env.DATABASE_URL ||
      `postgresql://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD || '')}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'postgres'}`;

    // Forcer IPv4 en utilisant le pool pg avec family: 4
    const pool = new pg.Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      family: 4, // Force IPv4 - évite ENETUNREACH sur Railway
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Set tenant context for Row-Level Security
   */
  async setTenantContext(tenantId: string) {
    await this.$executeRawUnsafe(`SET app.current_tenant = '${tenantId}'`);
  }

  /**
   * Clear tenant context
   */
  async clearTenantContext() {
    await this.$executeRawUnsafe(`RESET app.current_tenant`);
  }
}
