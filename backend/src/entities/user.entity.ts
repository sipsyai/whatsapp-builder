import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Message } from './message.entity';

export type UserRole = 'admin' | 'user';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 20, nullable: true })
  phoneNumber: string;

  @Column({ length: 100 })
  name: string;

  @Column({ nullable: true, length: 500 })
  avatar: string;

  @Column({ unique: true, nullable: true, length: 255 })
  email: string;

  @Column({ nullable: true, length: 255, select: false })
  password: string;

  @Column({ type: 'varchar', length: 20, default: 'user' })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastLoginAt: Date;

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
