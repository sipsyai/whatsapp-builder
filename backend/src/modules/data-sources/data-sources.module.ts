import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourcesController } from './data-sources.controller';
import { DataSourcesService } from './data-sources.service';
import { DataSource } from '../../entities/data-source.entity';
import { DataSourceConnection } from '../../entities/data-source-connection.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DataSource, DataSourceConnection])],
  controllers: [DataSourcesController],
  providers: [DataSourcesService],
  exports: [DataSourcesService],
})
export class DataSourcesModule {}
