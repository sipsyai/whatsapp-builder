import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { DataSourceConnection } from './data-source-connection.entity';

export enum DataSourceType {
  REST_API = 'REST_API',
  STRAPI = 'STRAPI',
  GRAPHQL = 'GRAPHQL',
}

export enum AuthType {
  NONE = 'NONE',
  BEARER = 'BEARER',
  API_KEY = 'API_KEY',
  BASIC = 'BASIC',
}

@Entity('data_sources')
export class DataSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: DataSourceType,
  })
  type: DataSourceType;

  @Column({ length: 500, name: 'base_url' })
  baseUrl: string;

  @Column({
    type: 'enum',
    enum: AuthType,
    default: AuthType.NONE,
    name: 'auth_type',
  })
  authType: AuthType;

  @Column({ type: 'text', nullable: true, name: 'auth_token' })
  authToken: string;

  @Column({ length: 100, nullable: true, name: 'auth_header_name' })
  authHeaderName: string;

  @Column({ type: 'jsonb', nullable: true })
  headers: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'integer', nullable: true })
  timeout: number;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => DataSourceConnection, (conn) => conn.dataSource)
  connections: DataSourceConnection[];
}
