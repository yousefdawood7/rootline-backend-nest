import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BETTER_AUTH } from './auth.constants';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockBetterAuth: {
    api: {
      signUpEmail: jest.Mock;
      signInEmail: jest.Mock;
      signOut: jest.Mock;
      getSession: jest.Mock;
    };
  };

  beforeEach(async () => {
    mockBetterAuth = {
      api: {
        signUpEmail: jest.fn(),
        signInEmail: jest.fn(),
        signOut: jest.fn(),
        getSession: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: BETTER_AUTH,
          useValue: mockBetterAuth,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a customer and return user profile with token', async () => {
      const mockUser = {
        id: 'u1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        emailVerified: false,
        role: 'CUSTOMER',
        createdAt: new Date(),
      };

      const mockResponse = new Response(
        JSON.stringify({ user: mockUser, token: 'raw-token' }),
        {
          status: 200,
          headers: {
            'set-cookie': 'better-auth.session_token=signed-token; Path=/',
            'set-auth-token': 'signed-token',
          },
        },
      );

      mockBetterAuth.api.signUpEmail.mockResolvedValue(mockResponse);

      const result = await service.register({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
      });

      expect(result.body.user.email).toBe('jane@example.com');
      expect(result.body.user.role).toBe('CUSTOMER');
      expect(result.body.token).toBe('signed-token');
      expect(result.cookies).toHaveLength(1);
    });

    it('should throw ConflictException on duplicate email', async () => {
      const mockResponse = new Response(
        JSON.stringify({
          message: 'User already exists',
          code: 'USER_ALREADY_EXISTS',
        }),
        { status: 422 },
      );

      mockBetterAuth.api.signUpEmail.mockResolvedValue(mockResponse);

      await expect(
        service.register({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException on generic registration failure', async () => {
      const mockResponse = new Response(
        JSON.stringify({ message: 'Invalid payload', code: 'INVALID_DATA' }),
        { status: 400 },
      );

      mockBetterAuth.api.signUpEmail.mockResolvedValue(mockResponse);

      await expect(
        service.register({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should authenticate user and return profile with token', async () => {
      const mockUser = {
        id: 'u1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        emailVerified: false,
        role: 'CUSTOMER',
        createdAt: new Date(),
      };

      const mockResponse = new Response(
        JSON.stringify({ user: mockUser, token: 'raw-token' }),
        {
          status: 200,
          headers: {
            'set-cookie': 'better-auth.session_token=signed-token; Path=/',
            'set-auth-token': 'signed-token',
          },
        },
      );

      mockBetterAuth.api.signInEmail.mockResolvedValue(mockResponse);

      const result = await service.login({
        email: 'jane@example.com',
        password: 'Password123!',
      });

      expect(result.body.token).toBe('signed-token');
      expect(result.body.user.id).toBe('u1');
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      const mockResponse = new Response(
        JSON.stringify({ message: 'Invalid email or password' }),
        { status: 401 },
      );

      mockBetterAuth.api.signInEmail.mockResolvedValue(mockResponse);

      await expect(
        service.login({
          email: 'jane@example.com',
          password: 'WrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException when user is banned', async () => {
      const mockResponse = new Response(
        JSON.stringify({
          message: 'You have been banned from this application',
          code: 'BANNED_USER',
        }),
        { status: 403 },
      );

      mockBetterAuth.api.signInEmail.mockResolvedValue(mockResponse);

      await expect(
        service.login({
          email: 'banned@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('logout', () => {
    it('should sign out and return clearing cookies', async () => {
      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          'set-cookie': 'better-auth.session_token=; Max-Age=0; Path=/',
        },
      });

      mockBetterAuth.api.signOut.mockResolvedValue(mockResponse);

      const result = await service.logout();
      expect(result.body.success).toBe(true);
      expect(result.cookies).toHaveLength(1);
    });
  });

  describe('getSession', () => {
    it('should return session and user profile when session exists', async () => {
      mockBetterAuth.api.getSession.mockResolvedValue({
        user: {
          id: 'u1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          emailVerified: true,
          role: 'CUSTOMER',
          createdAt: new Date(),
        },
        session: {
          id: 's1',
          userId: 'u1',
          expiresAt: new Date(Date.now() + 100000),
          token: 'active-token',
        },
      });

      const result = await service.getSession(new Headers());
      expect(result.user.id).toBe('u1');
      expect(result.session.id).toBe('s1');
    });

    it('should throw UnauthorizedException when no active session', async () => {
      mockBetterAuth.api.getSession.mockResolvedValue(null);

      await expect(service.getSession(new Headers())).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
