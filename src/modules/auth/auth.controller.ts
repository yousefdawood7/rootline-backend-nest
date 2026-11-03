import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthResponseDto, SignOutResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { AllowAnonymous } from '../../common/decorators/auth.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { toFetchHeaders } from '../../common/utils/header.util';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @AllowAnonymous()
  @ApiOperation({
    summary: 'Register customer account',
    description:
      'Creates a new customer account, returns a session token, and sets the session cookie.',
  })
  @ApiCreatedResponse({
    description: 'Account successfully registered and authenticated',
    type: AuthResponseDto,
  })
  @ApiConflictResponse({
    description: 'Email already exists',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or unexpected fields',
    type: ErrorResponseDto,
  })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const headers = toFetchHeaders(req);
    const result = await this.authService.register(dto, headers);
    if (result.cookies.length > 0) {
      res.setHeader('Set-Cookie', result.cookies);
    }
    return result.body;
  }

  @Post('login')
  @AllowAnonymous()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User sign-in',
    description:
      'Authenticates credentials, returns a bearer session token, and sets the session cookie.',
  })
  @ApiOkResponse({
    description: 'Successfully authenticated',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'User is banned from accessing the platform',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or invalid payload',
    type: ErrorResponseDto,
  })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const headers = toFetchHeaders(req);
    const result = await this.authService.login(dto, headers);
    if (result.cookies.length > 0) {
      res.setHeader('Set-Cookie', result.cookies);
    }
    return result.body;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'User sign-out',
    description:
      'Invalidates the active session token in database and clears the session cookie.',
  })
  @ApiOkResponse({
    description: 'Successfully logged out',
    type: SignOutResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SignOutResponseDto> {
    const headers = toFetchHeaders(req);
    const result = await this.authService.logout(headers);
    if (result.cookies.length > 0) {
      res.setHeader('Set-Cookie', result.cookies);
    }
    return result.body;
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Current session information',
    description:
      'Retrieves the authenticated user profile and active session details.',
  })
  @ApiOkResponse({
    description: 'Session retrieved successfully',
    type: SessionResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication token missing or invalid',
    type: ErrorResponseDto,
  })
  async getMe(@Req() req: Request): Promise<SessionResponseDto> {
    const headers = toFetchHeaders(req);
    return this.authService.getSession(headers);
  }
}
