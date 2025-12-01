import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleOAuthController } from './google-oauth.controller';
import { GoogleOAuthService } from './google-oauth.service';
import { UserOAuthToken } from '../../entities/user-oauth-token.entity';
import { User } from '../../entities/user.entity';
import { CalendarShare } from '../../entities/calendar-share.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserOAuthToken, User, CalendarShare])],
  controllers: [GoogleOAuthController],
  providers: [GoogleOAuthService],
  exports: [GoogleOAuthService],
})
export class GoogleOAuthModule {}
