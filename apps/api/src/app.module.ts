import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ListingsModule } from './modules/listings/listings.module';
import { AdminModule } from './modules/admin/admin.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { VerificationModule } from './modules/verification/verification.module';
import { EscrowModule } from './modules/escrow/escrow.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { InquiriesModule } from './modules/inquiries/inquiries.module';
import { ProfessionalsModule } from './modules/professionals/professionals.module';
import { PermitsModule } from './modules/permits/permits.module';
import { LandJourneyModule } from './modules/land-journey/land-journey.module';
import { SearchModule } from './modules/search/search.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ListingsModule,
    AdminModule,
    PaymentsModule,
    DocumentsModule,
    NotificationsModule,
    VerificationModule,
    EscrowModule,
    FavoritesModule,
    InquiriesModule,
    ProfessionalsModule,
    PermitsModule,
    LandJourneyModule,
    SearchModule,
    ReviewsModule,
    SubscriptionsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
