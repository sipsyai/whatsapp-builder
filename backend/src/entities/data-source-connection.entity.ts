import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DataSource } from './data-source.entity';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

@Entity('data_source_connections')
export class DataSourceConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Foreign key to DataSource
  @Column({ type: 'uuid', name: 'data_source_id' })
  dataSourceId: string;

  @ManyToOne(() => DataSource, (ds) => ds.connections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'data_source_id' })
  dataSource: DataSource;

  // Connection configuration
  @Column({ length: 500 })
  endpoint: string; // Path like '/api/products'

  @Column({
    type: 'enum',
    enum: HttpMethod,
    default: HttpMethod.GET,
  })
  method: HttpMethod;

  @Column({ type: 'jsonb', nullable: true, name: 'default_params' })
  defaultParams: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true, name: 'default_body' })
  defaultBody: any;

  // Response transformation
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'data_key' })
  dataKey: string; // Path to data in response, e.g., 'data' or 'data.items'

  @Column({ type: 'jsonb', nullable: true, name: 'transform_config' })
  transformConfig: {
    idField: string;
    titleField: string;
    descriptionField?: string;
  };

  // Chained connection support (JSONPath)
  @Column({ type: 'uuid', nullable: true, name: 'depends_on_connection_id' })
  dependsOnConnectionId: string;

  @ManyToOne(() => DataSourceConnection, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'depends_on_connection_id' })
  dependsOnConnection: DataSourceConnection;

  @Column({ type: 'jsonb', nullable: true, name: 'param_mapping' })
  paramMapping: Record<string, string>; // JSONPath mappings like { "filters[brand][$eq]": "$.selectedBrand" }

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt: Date;
}
