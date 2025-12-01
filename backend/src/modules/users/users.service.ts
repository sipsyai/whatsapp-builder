import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UserOAuthToken, OAuthProvider } from '../../entities/user-oauth-token.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserOAuthToken)
    private readonly oauthTokenRepository: Repository<UserOAuthToken>,
  ) {}

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findWithGoogleCalendar(): Promise<{ id: string; name: string; email: string }[]> {
    // Find users who have an active Google Calendar OAuth token
    const tokens = await this.oauthTokenRepository.find({
      where: {
        provider: OAuthProvider.GOOGLE_CALENDAR,
        isActive: true,
      },
      relations: ['user'],
    });

    return tokens
      .filter(token => token.user)
      .map(token => ({
        id: token.user.id,
        name: token.user.name || token.metadata?.name || 'Unknown',
        email: token.metadata?.email || token.user.email || '',
      }));
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { phoneNumber } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async create(userData: Partial<User>): Promise<User> {
    if (userData.phoneNumber) {
      const existingUser = await this.findByPhoneNumber(userData.phoneNumber);
      if (existingUser) {
        throw new ConflictException('User with this phone number already exists');
      }
    }

    if (userData.email) {
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    const user = this.userRepository.create(userData);
    return await this.userRepository.save(user);
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findOne(id);

    if (updateData.phoneNumber && updateData.phoneNumber !== user.phoneNumber) {
      const existingUser = await this.findByPhoneNumber(updateData.phoneNumber);
      if (existingUser) {
        throw new ConflictException('User with this phone number already exists');
      }
    }

    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.findByEmail(updateData.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    Object.assign(user, updateData);
    return await this.userRepository.save(user);
  }

  async delete(id: string, currentUserId: string): Promise<{ success: boolean }> {
    // Prevent self-deletion
    if (id === currentUserId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return { success: true };
  }
}
