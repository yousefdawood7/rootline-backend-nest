import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BETTER_AUTH } from '../auth/auth.constants';
import type { BetterAuthClient } from '../auth/auth.constants';
import { PrismaService } from '../../database/prisma.service';
import {
  AdminUpdateUserStatusInput,
  AdminUserItem,
  AdminUserListResponse,
  AdminUserQuery,
} from './dto/admin-user.dto';
import { UpdateProfileInput, UserProfile } from './dto/user-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(BETTER_AUTH)
    private readonly auth: BetterAuthClient,
  ) {}

  private mapProfile(user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    role: string;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserProfile {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      image: user.image ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private mapAdminUser(user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    role: string;
    banned?: boolean | null;
    banReason?: string | null;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): AdminUserItem {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      banned: user.banned === true,
      banReason: user.banReason ?? null,
      image: user.image ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapProfile(user);
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<UserProfile> {
    const data: Prisma.UserUpdateInput = {};
    if (input.name !== undefined) {
      data.name = input.name;
    }
    if (input.image !== undefined) {
      data.image = input.image;
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.mapProfile(updated);
  }

  async adminListUsers(query: AdminUserQuery): Promise<AdminUserListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.banned !== undefined) {
      where.banned = query.banned;
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((u) => this.mapAdminUser(u)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async adminUpdateStatus(
    targetUserId: string,
    currentAdminId: string,
    input: AdminUpdateUserStatusInput,
    headers?: Headers,
  ): Promise<AdminUserItem> {
    if (input.banned && targetUserId === currentAdminId) {
      throw new BadRequestException('Admins cannot deactivate themselves');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    if (
      input.banned &&
      targetUser.role === 'ADMIN' &&
      targetUser.banned !== true
    ) {
      const activeAdminsCount = await this.prisma.user.count({
        where: {
          role: 'ADMIN',
          banned: { not: true },
        },
      });

      if (activeAdminsCount <= 1) {
        throw new BadRequestException(
          'Cannot deactivate the last remaining admin',
        );
      }
    }

    if (input.banned) {
      await this.auth.api.banUser({
        body: {
          userId: targetUserId,
          banReason: input.banReason ?? 'Deactivated by administrator',
        },
        ...(headers ? { headers } : {}),
      });
    } else {
      await this.auth.api.unbanUser({
        body: {
          userId: targetUserId,
        },
        ...(headers ? { headers } : {}),
      });
    }

    const reloaded = await this.prisma.user.findUniqueOrThrow({
      where: { id: targetUserId },
    });

    return this.mapAdminUser(reloaded);
  }
}
