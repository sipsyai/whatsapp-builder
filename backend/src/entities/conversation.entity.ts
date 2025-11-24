import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'conversation_participants',
    joinColumn: {
      name: 'conversationId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
  })
  participants: User[];

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @Column({ nullable: true, length: 1000 })
  lastMessage: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastMessageAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastCustomerMessageAt: Date;

  @Column({ type: 'boolean', default: true })
  isWindowOpen: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  /**
   * Check if the 24-hour messaging window is still open
   * WhatsApp allows free-form messages within 24 hours of last customer message
   */
  canSendSessionMessage(): boolean {
    if (!this.lastCustomerMessageAt) return false;
    const now = new Date();
    const diff = now.getTime() - this.lastCustomerMessageAt.getTime();
    return diff < 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }
}
