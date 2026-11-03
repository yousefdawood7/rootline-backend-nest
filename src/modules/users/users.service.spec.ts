import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BETTER_AUTH } from '../auth/auth.constants';
import { PrismaService } from '../../database/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let mockPrisma: {
    user: {
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };
  let mockBetterAuth: {
    api: {
      banUser: jest.Mock;
      unbanUser: jest.Mock;
    };
  };

  const sampleDate = new Date('2026-11-04T00:00:00.000Z');

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    mockBetterAuth = {
      api: {
        banUser: jest.fn(),
        unbanUser: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BETTER_AUTH, useValue: mockBetterAuth },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('getProfile', () => {
    it('should return mapped user profile when user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        name: 'Alice',
        email: 'alice@example.com',
        emailVerified: true,
        role: 'CUSTOMER',
        image: null,
        createdAt: sampleDate,
        updatedAt: sampleDate,
      });

      const profile = await service.getProfile('u1');
      expect(profile).toEqual({
        id: 'u1',
        name: 'Alice',
        email: 'alice@example.com',
        emailVerified: true,
        role: 'CUSTOMER',
        image: null,
        createdAt: sampleDate.toISOString(),
        updatedAt: sampleDate.toISOString(),
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'u1' },
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update name and image and return mapped profile', async () => {
      mockPrisma.user.update.mockResolvedValue({
        id: 'u1',
        name: 'Alice Updated',
        email: 'alice@example.com',
        emailVerified: true,
        role: 'CUSTOMER',
        image: 'https://example.com/avatar.jpg',
        createdAt: sampleDate,
        updatedAt: sampleDate,
      });

      const result = await service.updateProfile('u1', {
        name: 'Alice Updated',
        image: 'https://example.com/avatar.jpg',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: {
          name: 'Alice Updated',
          image: 'https://example.com/avatar.jpg',
        },
      });
      expect(result.name).toBe('Alice Updated');
      expect(result.image).toBe('https://example.com/avatar.jpg');
    });
  });

  describe('adminListUsers', () => {
    it('should query users with pagination, filters and search', async () => {
      const mockUsers = [
        {
          id: 'u1',
          name: 'Bob Admin',
          email: 'bob@example.com',
          emailVerified: true,
          role: 'ADMIN',
          banned: false,
          banReason: null,
          image: null,
          createdAt: sampleDate,
          updatedAt: sampleDate,
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.adminListUsers({
        page: 2,
        limit: 10,
        search: 'bob',
        role: 'ADMIN',
        banned: false,
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'bob', mode: 'insensitive' } },
            { email: { contains: 'bob', mode: 'insensitive' } },
          ],
          role: 'ADMIN',
          banned: false,
        },
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      expect(result.total).toBe(1);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.items[0].id).toBe('u1');
    });

    it('should use default pagination when not provided', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      const result = await service.adminListUsers({ page: 1, limit: 20 });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('adminUpdateStatus', () => {
    it('should forbid admin from deactivating themselves', async () => {
      await expect(
        service.adminUpdateStatus('admin-1', 'admin-1', {
          banned: true,
          banReason: 'Test',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if target user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.adminUpdateStatus('u-unknown', 'admin-1', {
          banned: true,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should prevent deactivating the last active admin', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'admin-2',
        role: 'ADMIN',
        banned: false,
      });
      mockPrisma.user.count.mockResolvedValue(1);

      await expect(
        service.adminUpdateStatus('admin-2', 'admin-1', {
          banned: true,
        }),
      ).rejects.toThrow(
        new BadRequestException('Cannot deactivate the last remaining admin'),
      );
    });

    it('should deactivate a customer successfully via banUser', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'customer-1',
        role: 'CUSTOMER',
        banned: false,
      });
      mockBetterAuth.api.banUser.mockResolvedValue({ success: true });
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        id: 'customer-1',
        name: 'Cust',
        email: 'cust@example.com',
        emailVerified: true,
        role: 'CUSTOMER',
        banned: true,
        banReason: 'Terms violation',
        image: null,
        createdAt: sampleDate,
        updatedAt: sampleDate,
      });

      const result = await service.adminUpdateStatus('customer-1', 'admin-1', {
        banned: true,
        banReason: 'Terms violation',
      });

      expect(mockBetterAuth.api.banUser).toHaveBeenCalledWith({
        body: {
          userId: 'customer-1',
          banReason: 'Terms violation',
        },
      });
      expect(result.banned).toBe(true);
      expect(result.banReason).toBe('Terms violation');
    });

    it('should activate a customer successfully via unbanUser', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'customer-1',
        role: 'CUSTOMER',
        banned: true,
      });
      mockBetterAuth.api.unbanUser.mockResolvedValue({ success: true });
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        id: 'customer-1',
        name: 'Cust',
        email: 'cust@example.com',
        emailVerified: true,
        role: 'CUSTOMER',
        banned: false,
        banReason: null,
        image: null,
        createdAt: sampleDate,
        updatedAt: sampleDate,
      });

      const result = await service.adminUpdateStatus('customer-1', 'admin-1', {
        banned: false,
      });

      expect(mockBetterAuth.api.unbanUser).toHaveBeenCalledWith({
        body: {
          userId: 'customer-1',
        },
      });
      expect(result.banned).toBe(false);
      expect(result.banReason).toBeNull();
    });
  });
});
