import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('whatsapp_config')
export class WhatsAppConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, name: 'phone_number_id' })
  phoneNumberId: string;

  @Column({ length: 255, name: 'business_account_id' })
  businessAccountId: string;

  @Column({ type: 'text', name: 'access_token' })
  accessToken: string;

  @Column({ length: 255, name: 'webhook_verify_token' })
  webhookVerifyToken: string;

  @Column({ type: 'text', nullable: true, name: 'app_secret' })
  appSecret?: string;

  @Column({ length: 500, nullable: true, name: 'backend_url' })
  backendUrl?: string;

  @Column({ length: 500, nullable: true, name: 'flow_endpoint_url' })
  flowEndpointUrl?: string;

  @Column({ length: 20, default: 'v24.0', name: 'api_version' })
  apiVersion: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt: Date;
}
