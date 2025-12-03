import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { GoogleCalendarIntegrationHandler } from './google-calendar.handler';
import { RestApiIntegrationHandler } from './rest-api.handler';
import { IntegrationHandlerRegistry } from './integration-handler.registry';

import { GoogleOAuthModule } from '../../../google-oauth/google-oauth.module';
import { DataSourcesModule } from '../../../data-sources/data-sources.module';
import { User } from '../../../../entities/user.entity';
import { UserOAuthToken } from '../../../../entities/user-oauth-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserOAuthToken]),
    HttpModule,
    GoogleOAuthModule,
    DataSourcesModule,
  ],
  providers: [
    GoogleCalendarIntegrationHandler,
    RestApiIntegrationHandler,
    IntegrationHandlerRegistry,
  ],
  exports: [
    IntegrationHandlerRegistry,
    GoogleCalendarIntegrationHandler,
    RestApiIntegrationHandler,
  ],
})
export class IntegrationHandlersModule {}
