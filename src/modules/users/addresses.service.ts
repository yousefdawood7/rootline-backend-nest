import { Injectable, NotFoundException } from '@nestjs/common';
import { Address } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  AddressResponse,
  CreateAddressInput,
  DeleteAddressResponse,
  UpdateAddressInput,
} from './dto/address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  private mapAddress(addr: Address): AddressResponse {
    return {
      id: addr.id,
      userId: addr.userId,
      recipientName: addr.recipientName,
      phone: addr.phone,
      street: addr.street,
      line2: addr.line2 ?? null,
      city: addr.city,
      state: addr.state ?? null,
      postalCode: addr.postalCode,
      country: addr.country,
      isDefault: addr.isDefault,
      createdAt: addr.createdAt.toISOString(),
      updatedAt: addr.updatedAt.toISOString(),
    };
  }

  async listAddresses(userId: string): Promise<AddressResponse[]> {
    const list = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return list.map((item) => this.mapAddress(item));
  }

  async createAddress(
    userId: string,
    input: CreateAddressInput,
  ): Promise<AddressResponse> {
    const isDefault = input.isDefault ?? false;

    return this.prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const created = await tx.address.create({
        data: {
          userId,
          recipientName: input.recipientName,
          phone: input.phone,
          street: input.street,
          line2: input.line2,
          city: input.city,
          state: input.state,
          postalCode: input.postalCode,
          country: input.country,
          isDefault,
        },
      });

      return this.mapAddress(created);
    });
  }

  async updateAddress(
    userId: string,
    addressId: string,
    input: UpdateAddressInput,
  ): Promise<AddressResponse> {
    const existing = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Address not found');
    }

    return this.prisma.$transaction(async (tx) => {
      if (input.isDefault === true) {
        await tx.address.updateMany({
          where: { userId, isDefault: true, id: { not: addressId } },
          data: { isDefault: false },
        });
      }

      const updated = await tx.address.update({
        where: { id: addressId },
        data: input,
      });

      return this.mapAddress(updated);
    });
  }

  async deleteAddress(
    userId: string,
    addressId: string,
  ): Promise<DeleteAddressResponse> {
    const existing = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    return {
      success: true,
      message: 'Address deleted successfully',
    };
  }
}
