import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { FlutterwaveService } from './flutterwave.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [HttpModule, NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, FlutterwaveService],
  exports: [PaymentsService, FlutterwaveService],
})
export class PaymentsModule {}
