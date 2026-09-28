import { Global, Module } from "@nestjs/common";

import { PrismaTransactionRunner } from "./prisma-transaction-runner.js";
import { PrismaService } from "./prisma.service.js";
import { TransactionRunner } from "./transaction-runner.js";

@Global()
@Module({
  providers: [PrismaService, { provide: TransactionRunner, useClass: PrismaTransactionRunner }],
  exports: [PrismaService, TransactionRunner],
})
export class DatabaseModule {}
