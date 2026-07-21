import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ElectronicInvoiceDispatcher } from './electronic-invoice-dispatcher.service';

function invoiceIdFromArgs(args: string[]) {
  const index = args.findIndex((argument) => argument === '--invoice-id');
  const value =
    index >= 0
      ? args[index + 1]
      : args
          .find((argument) => argument.startsWith('--invoice-id='))
          ?.split('=')[1];
  const invoiceId = Number(value);
  if (!Number.isInteger(invoiceId) || invoiceId < 1) {
    throw new Error(
      'Usage: npm run electronic-invoicing:dispatch -- --invoice-id <id>',
    );
  }
  return invoiceId;
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const result = await app
      .get(ElectronicInvoiceDispatcher)
      .dispatchPendingInvoice(invoiceIdFromArgs(process.argv.slice(2)));
    console.log(
      `Invoice ${result.consecutive} processed with status ${result.status}.`,
    );
  } finally {
    await app.close();
  }
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Invoice dispatch failed',
  );
  process.exitCode = 1;
});
