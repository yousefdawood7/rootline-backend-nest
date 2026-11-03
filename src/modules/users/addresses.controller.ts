import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import {
  AddressResponseDto,
  CreateAddressDto,
  DeleteAddressResponseDto,
  UpdateAddressDto,
} from './dto/address.dto';
import { CurrentUser } from '../../common/decorators/auth.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import type { CurrentUser as CurrentUserType } from '../../common/types/auth.types';

@ApiTags('Addresses')
@ApiBearerAuth('JWT-auth')
@Controller('users/me/addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @ApiOperation({
    summary: 'List user shipping addresses',
    description:
      'Retrieves all shipping addresses belonging to the authenticated user, ordered by default first.',
  })
  @ApiOkResponse({
    description: 'User addresses retrieved successfully',
    type: [AddressResponseDto],
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async listMyAddresses(
    @CurrentUser() user: CurrentUserType,
  ): Promise<AddressResponseDto[]> {
    return this.addressesService.listAddresses(user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create shipping address',
    description:
      'Creates a new shipping address. If marked default, any previous default is unset transactionally.',
  })
  @ApiCreatedResponse({
    description: 'Address created successfully',
    type: AddressResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or invalid address payload',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async createAddress(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    return this.addressesService.createAddress(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update shipping address',
    description:
      'Updates an existing shipping address. If marked default, other addresses are updated transactionally.',
  })
  @ApiParam({
    name: 'id',
    description: 'Address ID to update',
    type: String,
  })
  @ApiOkResponse({
    description: 'Address updated successfully',
    type: AddressResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Address not found or does not belong to user',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async updateAddress(
    @Param('id') addressId: string,
    @CurrentUser() user: CurrentUserType,
    @Body() dto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    return this.addressesService.updateAddress(user.id, addressId, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete shipping address',
    description:
      'Deletes a shipping address belonging to the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    description: 'Address ID to delete',
    type: String,
  })
  @ApiOkResponse({
    description: 'Address deleted successfully',
    type: DeleteAddressResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Address not found or does not belong to user',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async deleteAddress(
    @Param('id') addressId: string,
    @CurrentUser() user: CurrentUserType,
  ): Promise<DeleteAddressResponseDto> {
    return this.addressesService.deleteAddress(user.id, addressId);
  }
}
