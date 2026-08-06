import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/listo_erp?schema=public',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Check if migration is already applied
  const migrations = await prisma.$queryRaw`
    SELECT * FROM _prisma_migrations
    WHERE migration_name = '20260806000000_split-numbering-per-till'
  `;
  console.log('Existing migrations:', migrations);

  if (migrations.length === 0) {
    // Mark migration as applied
    await prisma.$executeRaw`
      INSERT INTO _prisma_migrations (id, checksum, migration_name, finished_at, applied_steps_count)
      VALUES (
        gen_random_uuid()::text,
        'manual',
        '20260806000000_split-numbering-per-till',
        NOW(),
        1
      )
    `;
    console.log('Migration marked as applied');
  } else {
    console.log('Migration already exists in _prisma_migrations');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
