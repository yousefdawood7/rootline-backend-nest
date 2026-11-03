import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { BETTER_AUTH } from './auth.constants';
import type { BetterAuthClient } from './auth.constants';
import { LoginInput } from './dto/login.dto';
import { RegisterInput } from './dto/register.dto';
import {
  AuthResponse,
  AuthUserResponse,
  SignOutResponse,
} from './dto/auth-response.dto';
import { SessionResponse } from './dto/session-response.dto';
import { extractSetCookies } from '../../common/utils/cookie.util';

export interface ServiceAuthResult {
  cookies: string[];
  body: AuthResponse;
}

export interface ServiceSignOutResult {
  cookies: string[];
  body: SignOutResponse;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(BETTER_AUTH)
    private readonly auth: BetterAuthClient,
  ) {}

  private mapUser(user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    role?: string | null;
    image?: string | null;
    createdAt: Date | string;
  }): AuthUserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role ?? 'CUSTOMER',
      image: user.image ?? null,
      createdAt:
        typeof user.createdAt === 'string'
          ? user.createdAt
          : user.createdAt.toISOString(),
    };
  }

  async register(
    dto: RegisterInput,
    headers?: Headers,
  ): Promise<ServiceAuthResult> {
    const res = await this.auth.api.signUpEmail({
      body: {
        email: dto.email,
        password: dto.password,
        name: dto.name,
      },
      headers,
      asResponse: true,
    });

    if (!res.ok) {
      const errorBody = (await res.json().catch(() => ({}))) as {
        message?: string;
        code?: string;
      };

      if (
        res.status === 422 ||
        res.status === 409 ||
        errorBody.code?.includes('EXISTS')
      ) {
        throw new ConflictException(
          errorBody.message ?? 'A user with this email already exists',
        );
      }

      throw new BadRequestException(errorBody.message ?? 'Registration failed');
    }

    const cookies = extractSetCookies(res);
    const authToken = res.headers.get('set-auth-token');
    const data = (await res.json()) as {
      user: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
        role?: string;
        image?: string | null;
        createdAt: string | Date;
      };
      token?: string;
    };

    const token = authToken ?? data.token;
    if (!token) {
      throw new InternalServerErrorException(
        'Authentication token was not generated',
      );
    }

    return {
      cookies,
      body: {
        user: this.mapUser(data.user),
        token,
      },
    };
  }

  async login(dto: LoginInput, headers?: Headers): Promise<ServiceAuthResult> {
    const res = await this.auth.api.signInEmail({
      body: {
        email: dto.email,
        password: dto.password,
      },
      headers,
      asResponse: true,
    });

    if (!res.ok) {
      const errorBody = (await res.json().catch(() => ({}))) as {
        message?: string;
        code?: string;
      };

      if (res.status === 403 || errorBody.code === 'BANNED_USER') {
        throw new ForbiddenException(
          errorBody.message ?? 'You have been banned from this application',
        );
      }

      if (res.status === 401) {
        throw new UnauthorizedException(
          errorBody.message ?? 'Invalid email or password',
        );
      }

      throw new BadRequestException(errorBody.message ?? 'Login failed');
    }

    const cookies = extractSetCookies(res);
    const authToken = res.headers.get('set-auth-token');
    const data = (await res.json()) as {
      user: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
        role?: string;
        image?: string | null;
        createdAt: string | Date;
      };
      token?: string;
    };

    const token = authToken ?? data.token;
    if (!token) {
      throw new InternalServerErrorException(
        'Authentication token was not generated',
      );
    }

    return {
      cookies,
      body: {
        user: this.mapUser(data.user),
        token,
      },
    };
  }

  async logout(headers?: Headers): Promise<ServiceSignOutResult> {
    const res = await this.auth.api.signOut({
      headers: headers ?? new Headers(),
      asResponse: true,
    });

    const cookies = extractSetCookies(res);
    return {
      cookies,
      body: {
        success: true,
        message: 'Logged out successfully',
      },
    };
  }

  async getSession(headers: Headers): Promise<SessionResponse> {
    const sessionData = await this.auth.api.getSession({
      headers,
    });

    if (!sessionData?.session || !sessionData?.user) {
      throw new UnauthorizedException('Authentication required');
    }

    return {
      user: this.mapUser(sessionData.user),
      session: {
        id: sessionData.session.id,
        userId: sessionData.session.userId,
        expiresAt:
          typeof sessionData.session.expiresAt === 'string'
            ? sessionData.session.expiresAt
            : sessionData.session.expiresAt.toISOString(),
        token: sessionData.session.token,
      },
    };
  }
}
