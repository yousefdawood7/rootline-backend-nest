import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  AdminUpdateUserStatusDto,
  AdminUserItemDto,
  AdminUserListResponseDto,
  AdminUserQueryDto,
} from './dto/admin-user.dto';
import { CurrentUser, Roles } from '../../common/decorators/auth.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { toFetchHeaders } from '../../common/utils/header.util';
import type { CurrentUser as CurrentUserType } from '../../common/types/auth.types';

@ApiTags('Admin - Users')
@ApiBearerAuth('JWT-auth')
@Roles('ADMIN')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'List and search users',
    description:
      'Search and paginate users by name, email, role, and active/banned status. Restricted to ADMIN.',
  })
  @ApiOkResponse({
    description: 'Paginated user list retrieved successfully',
    type: AdminUserListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions (requires ADMIN role)',
    type: ErrorResponseDto,
  })
  async listUsers(
    @Query() query: AdminUserQueryDto,
  ): Promise<AdminUserListResponseDto> {
    return this.usersService.adminListUsers(query);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Activate or deactivate user account',
    description:
      'Ban (deactivate) or unban (activate) user account. Immediately revokes sessions. Admins cannot deactivate themselves or the last remaining admin.',
  })
  @ApiParam({
    name: 'id',
    description: 'Target user ID',
    type: String,
  })
  @ApiOkResponse({
    description: 'User status successfully updated',
    type: AdminUserItemDto,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid request, self-deactivation attempt, or last admin protection triggered',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Forbidden (requires ADMIN role)',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Target user not found',
    type: ErrorResponseDto,
  })
  async updateUserStatus(
    @Param('id') targetUserId: string,
    @Body() dto: AdminUpdateUserStatusDto,
    @CurrentUser() adminUser: CurrentUserType,
    @Req() req: Request,
  ): Promise<AdminUserItemDto> {
    const headers = toFetchHeaders(req);
    return this.usersService.adminUpdateStatus(
      targetUserId,
      adminUser.id,
      dto,
      headers,
    );
  }
}
