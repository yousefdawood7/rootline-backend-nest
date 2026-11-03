import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto, UserProfileDto } from './dto/user-profile.dto';
import { CurrentUser } from '../../common/decorators/auth.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import type { CurrentUser as CurrentUserType } from '../../common/types/auth.types';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieves profile details for the currently logged in user.',
  })
  @ApiOkResponse({
    description: 'User profile retrieved successfully',
    type: UserProfileDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async getMyProfile(
    @CurrentUser() user: CurrentUserType,
  ): Promise<UserProfileDto> {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update current user profile',
    description:
      'Updates mutable fields (name, image) of the logged in user profile. Unknown fields are rejected.',
  })
  @ApiOkResponse({
    description: 'User profile updated successfully',
    type: UserProfileDto,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid input or unrecognized fields (e.g. role escalation attempt)',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async updateMyProfile(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    return this.usersService.updateProfile(user.id, dto);
  }
}
