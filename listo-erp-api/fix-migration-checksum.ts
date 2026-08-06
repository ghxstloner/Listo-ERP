import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import { join } from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/listo_erp?schema=public',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Read migration file and calculate checksum
  const migrationPath = join(
    __dirname,
    'prisma/migrations/20260806000000_split-numbering-per-till/migration.sql'
  );
  const migrationContent = readFileSync(migrationPath, 'utf-8');
  const checksum = createHash('sha256').update(migrationContent).digest('hex');
  console.log('Calculated checksum:', checksum);

  // Update migration record
  await prisma.$executeRaw`
    UPDATE _prisma_migrations
    SET checksum = ${checksum},
        applied_steps_count = 1,
        finished_at = NOW()
    WHERE migration_name = '20260806000000_split-numbering-per-till'
  `;
  console.log('Migration record updated');

  // Verify
  const migrations = await prisma.$queryRaw`
    SELECT * FROM _prisma_migrations
    WHERE migration_name = '20260806000000_split-numbering-per-till'
  `;
  console.log('Updated migration:', migrations);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
