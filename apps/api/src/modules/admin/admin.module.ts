import { Module } from '@nestjs/common';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminListingsController } from './admin-listings.controller';
import { AdminTransactionsController } from './admin-transactions.controller';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [
    AdminDashboardController,
    AdminUsersController,
    AdminListingsController,
    AdminTransactionsController,
    AdminSettingsController,
  ],
  providers: [AdminService],
})
export class AdminModule {}
