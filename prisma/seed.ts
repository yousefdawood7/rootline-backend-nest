import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { env } from '../src/config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  console.log('Seeding database skeleton...');
  await prisma.$queryRaw`SELECT 1`;
  console.log('Database connection verified for seeding.');
  console.log('Seed completed successfully (ready for Phase 1 entities).');
}

main()
  .catch((e: unknown) => {
    console.error('Database seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
