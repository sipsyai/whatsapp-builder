import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum WhatsAppFlowStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  DEPRECATED = 'DEPRECATED',
  THROTTLED = 'THROTTLED',
  BLOCKED = 'BLOCKED',
}

export enum WhatsAppFlowCategory {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  APPOINTMENT_BOOKING = 'APPOINTMENT_BOOKING',
  LEAD_GENERATION = 'LEAD_GENERATION',
  CONTACT_US = 'CONTACT_US',
  CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
  SURVEY = 'SURVEY',
  OTHER = 'OTHER',
}

@Entity('whatsapp_flows')
export class WhatsAppFlow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'whatsapp_flow_id', unique: true, nullable: true })
  whatsappFlowId?: string; // Flow ID from WhatsApp API (after publish)

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: WhatsAppFlowStatus,
    default: WhatsAppFlowStatus.DRAFT,
  })
  status: WhatsAppFlowStatus;

  @Column({ type: 'jsonb', default: '[]' })
  categories: WhatsAppFlowCategory[];

  @Column({ type: 'jsonb' })
  flowJson: any; // Complete Flow JSON structure

  @Column({ type: 'varchar', length: 500, name: 'endpoint_uri', nullable: true })
  endpointUri?: string; // Optional endpoint URL for data_exchange

  @Column({ type: 'text', name: 'preview_url', nullable: true })
  previewUrl?: string; // Preview URL from WhatsApp

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>; // Additional metadata (validation errors, etc.)

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt: Date;
}
