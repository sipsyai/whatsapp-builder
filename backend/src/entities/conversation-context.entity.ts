import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { ChatBot } from './chatbot.entity';

export interface NodeOutput {
  nodeId: string;
  nodeType: string;
  nodeLabel?: string;
  executedAt: string;
  success: boolean;
  duration?: number;
  data?: any;
  error?: string;
  statusCode?: number;
  userResponse?: string;
  buttonId?: string;
  listRowId?: string;
  flowResponse?: any;
  outputVariable?: string;
}

/**
 * Metadata for test sessions
 * Only populated when isTestSession = true
 */
export interface TestMetadata {
  /** User ID who initiated the test */
  selectedUserId: string;
  /** Simulated phone number for the test */
  testPhoneNumber: string;
  /** When the test was started (ISO date string) */
  startedAt: string;
  /** Type of test: simulate (no real messages) or live (actual WhatsApp) */
  testMode: 'simulate' | 'live';
  /** Optional notes about the test */
  notes?: string;
  /** Browser/client info for debugging */
  userAgent?: string;
}

@Entity('conversation_contexts')
@Check(
  'CHK_test_metadata_consistency',
  `("isTestSession" = false AND "testMetadata" IS NULL) OR ("isTestSession" = true)`,
)
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

  @Column({ type: 'jsonb', default: '{}' })
  nodeOutputs: Record<string, NodeOutput>;

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

  // ============================================
  // Test Session Fields
  // ============================================

  /**
   * Indicates if this is a test session (not a real WhatsApp conversation)
   * Test sessions are created from the chatbot builder for testing flows
   */
  @Column({ type: 'boolean', default: false })
  @Index('IDX_conversation_contexts_test_session', {
    where: '"isTestSession" = true',
  })
  isTestSession: boolean;

  /**
   * Metadata for test sessions
   * Only populated when isTestSession = true
   * Contains info about who started the test, simulated phone number, etc.
   */
  @Column({ type: 'jsonb', nullable: true })
  testMetadata: TestMetadata | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Check if this is a real production session (not a test)
   */
  isProductionSession(): boolean {
    return !this.isTestSession;
  }

  /**
   * Check if this session can be safely deleted
   * Test sessions can always be deleted, production sessions need confirmation
   */
  canSafelyDelete(): boolean {
    return this.isTestSession;
  }
}
