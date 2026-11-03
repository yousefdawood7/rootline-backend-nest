import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { AddressesService } from './addresses.service';

describe('AddressesService', () => {
  let service: AddressesService;
  let mockPrisma: {
    address: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const sampleDate = new Date('2026-11-04T00:00:00.000Z');

  const sampleAddress = {
    id: 'addr-1',
    userId: 'user-1',
    recipientName: 'Alice Smith',
    phone: '+1234567890',
    street: '123 Main St',
    line2: 'Apt 4B',
    city: 'Metropolis',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
    isDefault: true,
    createdAt: sampleDate,
    updatedAt: sampleDate,
  };

  beforeEach(async () => {
    mockPrisma = {
      address: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AddressesService>(AddressesService);
  });

  describe('listAddresses', () => {
    it('should return mapped address list for the user', async () => {
      mockPrisma.address.findMany.mockResolvedValue([sampleAddress]);

      const result = await service.listAddresses('user-1');

      expect(mockPrisma.address.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('addr-1');
      expect(result[0].createdAt).toBe(sampleDate.toISOString());
    });
  });

  describe('createAddress', () => {
    it('should unset existing defaults in a transaction when new address is default', async () => {
      const mockTx = {
        address: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          create: jest.fn().mockResolvedValue(sampleAddress),
        },
      };

      mockPrisma.$transaction.mockImplementation(
        (callback: (tx: typeof mockTx) => Promise<unknown>) => callback(mockTx),
      );

      const result = await service.createAddress('user-1', {
        recipientName: 'Alice Smith',
        phone: '+1234567890',
        street: '123 Main St',
        line2: 'Apt 4B',
        city: 'Metropolis',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        isDefault: true,
      });

      expect(mockTx.address.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isDefault: true },
        data: { isDefault: false },
      });
      expect(mockTx.address.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          recipientName: 'Alice Smith',
          phone: '+1234567890',
          street: '123 Main St',
          line2: 'Apt 4B',
          city: 'Metropolis',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          isDefault: true,
        },
      });
      expect(result.id).toBe('addr-1');
    });

    it('should not update existing defaults if new address is not default', async () => {
      const nonDefaultAddr = { ...sampleAddress, isDefault: false };
      const mockTx = {
        address: {
          updateMany: jest.fn(),
          create: jest.fn().mockResolvedValue(nonDefaultAddr),
        },
      };

      mockPrisma.$transaction.mockImplementation(
        (callback: (tx: typeof mockTx) => Promise<unknown>) => callback(mockTx),
      );

      const result = await service.createAddress('user-1', {
        recipientName: 'Alice Smith',
        phone: '+1234567890',
        street: '123 Main St',
        city: 'Metropolis',
        postalCode: '10001',
        country: 'US',
        isDefault: false,
      });

      expect(mockTx.address.updateMany).not.toHaveBeenCalled();
      expect(result.isDefault).toBe(false);
    });
  });

  describe('updateAddress', () => {
    it('should throw NotFoundException if address not found or not owned by user', async () => {
      mockPrisma.address.findUnique.mockResolvedValue(null);

      await expect(
        service.updateAddress('user-1', 'addr-unknown', { city: 'New City' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if address belongs to another user', async () => {
      mockPrisma.address.findUnique.mockResolvedValue({
        ...sampleAddress,
        userId: 'other-user',
      });

      await expect(
        service.updateAddress('user-1', 'addr-1', { city: 'New City' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update address and unset other defaults if marked default', async () => {
      mockPrisma.address.findUnique.mockResolvedValue(sampleAddress);

      const mockTx = {
        address: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          update: jest.fn().mockResolvedValue({
            ...sampleAddress,
            city: 'New City',
            isDefault: true,
          }),
        },
      };

      mockPrisma.$transaction.mockImplementation(
        (callback: (tx: typeof mockTx) => Promise<unknown>) => callback(mockTx),
      );

      const result = await service.updateAddress('user-1', 'addr-1', {
        city: 'New City',
        isDefault: true,
      });

      expect(mockTx.address.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isDefault: true, id: { not: 'addr-1' } },
        data: { isDefault: false },
      });
      expect(result.city).toBe('New City');
    });
  });

  describe('deleteAddress', () => {
    it('should throw NotFoundException if address not found', async () => {
      mockPrisma.address.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteAddress('user-1', 'addr-unknown'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if address belongs to another user', async () => {
      mockPrisma.address.findUnique.mockResolvedValue({
        ...sampleAddress,
        userId: 'other-user',
      });

      await expect(service.deleteAddress('user-1', 'addr-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete address when owned by user', async () => {
      mockPrisma.address.findUnique.mockResolvedValue(sampleAddress);
      mockPrisma.address.delete.mockResolvedValue(sampleAddress);

      const result = await service.deleteAddress('user-1', 'addr-1');

      expect(mockPrisma.address.delete).toHaveBeenCalledWith({
        where: { id: 'addr-1' },
      });
      expect(result.success).toBe(true);
    });
  });
});
