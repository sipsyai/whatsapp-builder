import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Calendar } from './calendar.entity';

export enum CalendarPermission {
  READ = 'READ',
  WRITE = 'WRITE',
  ADMIN = 'ADMIN',
}

export enum InviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

@Entity('calendar_shares')
@Index(['calendarId', 'userId'], { unique: true })
@Index(['inviteToken'], { unique: true, where: '"invite_token" IS NOT NULL' })
export class CalendarShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'calendar_id' })
  calendarId: string;

  @ManyToOne(() => Calendar, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'calendar_id' })
  calendar: Calendar;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: CalendarPermission,
    default: CalendarPermission.READ,
  })
  permission: CalendarPermission;

  @Column({ type: 'varchar', length: 100, name: 'invite_token', nullable: true })
  inviteToken: string;

  @Column({ type: 'timestamp with time zone', name: 'invite_expires_at', nullable: true })
  inviteExpiresAt: Date;

  @Column({
    type: 'enum',
    enum: InviteStatus,
    default: InviteStatus.PENDING,
    name: 'invite_status',
  })
  inviteStatus: InviteStatus;

  @Column({ type: 'varchar', length: 255, name: 'invited_email', nullable: true })
  invitedEmail: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt: Date;
}
