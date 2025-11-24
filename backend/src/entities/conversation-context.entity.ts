import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { Flow } from './flow.entity';

@Entity('conversation_contexts')
export class ConversationContext {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Column({ type: 'uuid' })
  flowId: string;

  @ManyToOne(() => Flow, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'flowId' })
  flow: Flow;

  @Column({ type: 'varchar', length: '255' })
  currentNodeId: string;

  @Column({ type: 'jsonb', default: '{}' })
  variables: Record<string, any>;

  @Column({ type: 'jsonb', default: '[]' })
  nodeHistory: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
