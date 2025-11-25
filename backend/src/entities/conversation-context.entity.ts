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
import { ChatBot } from './chatbot.entity';

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
  chatbotId: string;

  @ManyToOne(() => ChatBot, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chatbotId' })
  chatbot: ChatBot;

  @Column({ type: 'varchar', length: '255' })
  currentNodeId: string;

  @Column({ type: 'jsonb', default: '{}' })
  variables: Record<string, any>;

  @Column({ type: 'jsonb', default: '[]' })
  nodeHistory: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 50, default: 'running' })
  status: 'running' | 'waiting_input' | 'waiting_flow' | 'completed' | 'expired' | 'stopped';

  @Column({ type: 'timestamp with time zone', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  completionReason: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
