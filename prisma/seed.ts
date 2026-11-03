import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { env } from '../src/config/env';
import { createBetterAuth } from '../src/config/auth.config';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const auth = createBetterAuth(prisma);

async function main(): Promise<void> {
  console.log('Seeding Phase 1 initial data...');

  const adminEmail = env.ADMIN_EMAIL.toLowerCase();
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    console.log(`Creating initial admin user (${adminEmail})...`);
    await auth.api.createUser({
      body: {
        email: adminEmail,
        password: env.ADMIN_PASSWORD,
        name: 'System Administrator',
        role: 'ADMIN',
      },
    });
    console.log('Initial admin user successfully created.');
  } else {
    console.log(`Admin user (${adminEmail}) already exists. Ensuring ADMIN role...`);
    if (existingAdmin.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { role: 'ADMIN' },
      });
      console.log('Updated existing user role to ADMIN.');
    }
  }

  console.log('Seed completed successfully.');
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
