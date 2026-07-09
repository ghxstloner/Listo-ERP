import { Prisma } from '@prisma/client';

export function isUniqueConstraintError(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
    return true;
  }
  const err = e as {
    code?: string;
    cause?: { originalCode?: string };
    meta?: { driverAdapterError?: { cause?: { originalCode?: string } } };
  };
  if (err?.code === 'P2002') return true;
  if (err?.cause?.originalCode === '23505') return true;
  const adapterCause = err?.meta?.driverAdapterError?.cause;
  if (adapterCause?.originalCode === '23505') return true;
  return false;
}
