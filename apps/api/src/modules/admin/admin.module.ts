import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller';
import { AdminListingsController } from './admin-listings.controller';
import { AdminTransactionsController } from './admin-transactions.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [
    AdminUsersController,
    AdminListingsController,
    AdminTransactionsController,
  ],
  providers: [AdminService],
})
export class AdminModule {}
