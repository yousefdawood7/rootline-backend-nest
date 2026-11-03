import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { z } from 'zod';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../src/database/prisma.service';
import { env } from '../src/config/env';
import { ErrorResponseSchema } from '../src/common/dto/error-response.dto';
import { AuthResponseSchema } from '../src/modules/auth/dto/auth-response.dto';
import { SessionResponseSchema } from '../src/modules/auth/dto/session-response.dto';
import { UserProfileSchema } from '../src/modules/users/dto/user-profile.dto';
import {
  AdminUserItemSchema,
  AdminUserListResponseSchema,
} from '../src/modules/users/dto/admin-user.dto';
import {
  AddressResponseSchema,
  DeleteAddressResponseSchema,
} from '../src/modules/users/dto/address.dto';

const SuccessResponseSchema = z.object({
  success: z.boolean(),
});

describe('Auth & Users (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const testId = Date.now().toString();
  const customerEmail = `e2e_auth_test_cust_${testId}@example.com`;
  const customerPassword = 'CustomerPassword123!';
  const customerName = 'Jane Tester';

  let customerToken: string;
  let customerCookie: string;
  let customerId: string;

  let adminToken: string;
  let adminId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    prisma = app.get(PrismaService);

    // Login as the seeded admin
    const adminLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD,
      })
      .expect(200);

    const parsed = AuthResponseSchema.parse(adminLoginRes.body);
    adminToken = parsed.token;
    adminId = parsed.user.id;
  }, 30000);

  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: {
          email: {
            contains: 'e2e_auth_test_',
          },
        },
      });
    } catch {
      // Ignore cleanup error if already removed
    }

    await app.close();
  });

  describe('1. Disabled Native Better Auth Endpoints', () => {
    it('POST /api/auth/sign-up/email should be disabled and return 404', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({
          email: `disabled_${testId}@example.com`,
          password: 'Password123!',
          name: 'Disabled Path User',
        })
        .expect(404);
    });

    it('POST /api/auth/sign-in/email should be disabled and return 404', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({
          email: env.ADMIN_EMAIL,
          password: env.ADMIN_PASSWORD,
        })
        .expect(404);
    });
  });

  describe('2. Registration & Privilege Escalation Prevention', () => {
    it('should reject registration payloads with unknown fields (role escalation attempt)', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `escalate_${testId}@example.com`,
          password: 'Password123!',
          name: 'Hacker',
          role: 'ADMIN',
        })
        .expect(400);

      const parsed = ErrorResponseSchema.parse(res.body);
      expect(parsed.statusCode).toBe(400);
      expect(parsed.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration payloads with banned flag', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `escalate2_${testId}@example.com`,
          password: 'Password123!',
          name: 'Hacker',
          banned: true,
        })
        .expect(400);

      const parsed = ErrorResponseSchema.parse(res.body);
      expect(parsed.statusCode).toBe(400);
    });

    it('should successfully register a customer, defaulting role to CUSTOMER', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `  ${customerEmail.toUpperCase()}  `,
          password: customerPassword,
          name: customerName,
        })
        .expect(201);

      const parsed = AuthResponseSchema.parse(res.body);
      expect(parsed.user.email).toBe(customerEmail.toLowerCase());
      expect(parsed.user.name).toBe(customerName);
      expect(parsed.user.role).toBe('CUSTOMER');
      expect(typeof parsed.token).toBe('string');

      customerToken = parsed.token;
      customerId = parsed.user.id;

      const rawCookies: unknown = res.headers['set-cookie'];
      expect(rawCookies).toBeDefined();
      const cookieStr = Array.isArray(rawCookies)
        ? rawCookies.join('; ')
        : String(rawCookies);
      expect(cookieStr).toContain('better-auth.session_token');
      customerCookie = Array.isArray(rawCookies)
        ? String(rawCookies[0])
        : String(rawCookies);
    });

    it('should return 409 Conflict when attempting to register duplicate email', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: customerEmail,
          password: 'AnotherPassword123!',
          name: 'Duplicate Jane',
        })
        .expect(409);

      const parsed = ErrorResponseSchema.parse(res.body);
      expect(parsed.statusCode).toBe(409);
    });
  });

  describe('3. Login Flow', () => {
    it('should reject login with invalid password with 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: customerEmail,
          password: 'WrongPassword!',
        })
        .expect(401);

      const parsed = ErrorResponseSchema.parse(res.body);
      expect(parsed.statusCode).toBe(401);
    });

    it('should successfully login customer and return token and Set-Cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: customerEmail,
          password: customerPassword,
        })
        .expect(200);

      const parsed = AuthResponseSchema.parse(res.body);
      expect(parsed.user.id).toBe(customerId);
      expect(parsed.user.role).toBe('CUSTOMER');

      customerToken = parsed.token;
      const rawCookies: unknown = res.headers['set-cookie'];
      customerCookie = Array.isArray(rawCookies)
        ? String(rawCookies[0])
        : String(rawCookies);
    });
  });

  describe('4. Session Authentication & Profile', () => {
    it('should authenticate GET /auth/me with Bearer token', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      const parsed = SessionResponseSchema.parse(res.body);
      expect(parsed.user.id).toBe(customerId);
      expect(parsed.session).toBeDefined();
    });

    it('should authenticate GET /auth/me with Cookie header', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', customerCookie)
        .expect(200);

      const parsed = SessionResponseSchema.parse(res.body);
      expect(parsed.user.id).toBe(customerId);
    });

    it('should reject unauthenticated GET /users/me with 401', async () => {
      await request(app.getHttpServer()).get('/users/me').expect(401);
    });

    it('should get current user profile via GET /users/me', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      const parsed = UserProfileSchema.parse(res.body);
      expect(parsed.id).toBe(customerId);
      expect(parsed.email).toBe(customerEmail);
      expect(parsed.role).toBe('CUSTOMER');
    });

    it('should update profile via PATCH /users/me', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Jane Updated',
          image: 'https://example.com/avatar.png',
        })
        .expect(200);

      const parsed = UserProfileSchema.parse(res.body);
      expect(parsed.name).toBe('Jane Updated');
      expect(parsed.image).toBe('https://example.com/avatar.png');
    });

    it('should reject PATCH /users/me with unauthorized extra fields (strict schema)', async () => {
      await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Jane Hacked',
          role: 'ADMIN',
        })
        .expect(400);
    });
  });

  describe('5. Admin RBAC & User Management', () => {
    it('should reject CUSTOMER accessing GET /admin/users with 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should allow ADMIN to list users with pagination via GET /admin/users', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const parsed = AdminUserListResponseSchema.parse(res.body);
      expect(parsed.items).toBeInstanceOf(Array);
      expect(parsed.total).toBeGreaterThanOrEqual(1);
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(10);
    });

    it('should filter users by search query and role', async () => {
      const res = await request(app.getHttpServer())
        .get(`/admin/users?search=${customerEmail}&role=CUSTOMER`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const parsed = AdminUserListResponseSchema.parse(res.body);
      expect(parsed.items.length).toBe(1);
      expect(parsed.items[0].email).toBe(customerEmail);
    });

    it('should forbid admin from deactivating themselves with 400', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/admin/users/${adminId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ banned: true, banReason: 'Self deactivation' })
        .expect(400);

      const parsed = ErrorResponseSchema.parse(res.body);
      expect(parsed.message).toContain('Admins cannot deactivate themselves');
    });

    it('should allow deactivating a secondary admin and allow updating ban status without false last-admin error', async () => {
      const secondAdmin = await prisma.user.create({
        data: {
          id: `e2e_auth_test_sec_admin_${testId}`,
          name: 'Secondary Admin',
          email: `e2e_auth_test_sec_admin_${testId}@example.com`,
          emailVerified: true,
          role: 'ADMIN',
          banned: false,
        },
      });

      // Admin 1 deactivates Admin 2
      const banRes = await request(app.getHttpServer())
        .patch(`/admin/users/${secondAdmin.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          banned: true,
          banReason: 'Testing secondary admin deactivation',
        })
        .expect(200);

      const parsedBan = AdminUserItemSchema.parse(banRes.body);
      expect(parsedBan.banned).toBe(true);

      // Now only 1 active admin remains. Updating the already-banned admin must NOT trigger last-admin error.
      const updateRes = await request(app.getHttpServer())
        .patch(`/admin/users/${secondAdmin.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          banned: true,
          banReason: 'Updated ban reason for deactivated admin',
        })
        .expect(200);

      const parsedUpdate = AdminUserItemSchema.parse(updateRes.body);
      expect(parsedUpdate.banned).toBe(true);
      expect(parsedUpdate.banReason).toBe(
        'Updated ban reason for deactivated admin',
      );
    });

    it('should allow admin to ban a customer and verify immediate session invalidation', async () => {
      const banRes = await request(app.getHttpServer())
        .patch(`/admin/users/${customerId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ banned: true, banReason: 'Violation of community terms' })
        .expect(200);

      const parsedBan = AdminUserItemSchema.parse(banRes.body);
      expect(parsedBan.banned).toBe(true);
      expect(parsedBan.banReason).toBe('Violation of community terms');

      // Immediate session revocation check
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(401);

      // Customer cannot login while banned
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: customerEmail,
          password: customerPassword,
        })
        .expect(403);
    });

    it('should allow admin to unban a customer and allow login again', async () => {
      const unbanRes = await request(app.getHttpServer())
        .patch(`/admin/users/${customerId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ banned: false })
        .expect(200);

      const parsedUnban = AdminUserItemSchema.parse(unbanRes.body);
      expect(parsedUnban.banned).toBe(false);

      // Customer can log back in
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: customerEmail,
          password: customerPassword,
        })
        .expect(200);

      const parsedLogin = AuthResponseSchema.parse(loginRes.body);
      customerToken = parsedLogin.token;
      const rawCookies: unknown = loginRes.headers['set-cookie'];
      customerCookie = Array.isArray(rawCookies)
        ? String(rawCookies[0])
        : String(rawCookies);
    });
  });

  describe('6. Shipping Addresses & Transactional Default Guarantee', () => {
    let address1Id: string;
    let address2Id: string;

    it('should create first shipping address with isDefault: true', async () => {
      const res = await request(app.getHttpServer())
        .post('/users/me/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          recipientName: 'Jane Tester',
          phone: '+15551234567',
          street: '100 Broadway',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          isDefault: true,
        })
        .expect(201);

      const parsed = AddressResponseSchema.parse(res.body);
      expect(parsed.id).toBeDefined();
      expect(parsed.isDefault).toBe(true);
      address1Id = parsed.id;
    });

    it('should create second shipping address with isDefault: true and automatically unset previous default', async () => {
      const res = await request(app.getHttpServer())
        .post('/users/me/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          recipientName: 'Jane Work',
          phone: '+15559876543',
          street: '500 5th Avenue',
          city: 'New York',
          state: 'NY',
          postalCode: '10110',
          country: 'US',
          isDefault: true,
        })
        .expect(201);

      const parsed = AddressResponseSchema.parse(res.body);
      expect(parsed.id).toBeDefined();
      expect(parsed.isDefault).toBe(true);
      address2Id = parsed.id;

      const listRes = await request(app.getHttpServer())
        .get('/users/me/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      const list = z.array(AddressResponseSchema).parse(listRes.body);
      expect(list).toHaveLength(2);
      const addr1 = list.find((a) => a.id === address1Id);
      const addr2 = list.find((a) => a.id === address2Id);

      expect(addr2?.isDefault).toBe(true);
      expect(addr1?.isDefault).toBe(false);
    });

    it('should update address1 to isDefault: true and unset address2 default', async () => {
      await request(app.getHttpServer())
        .patch(`/users/me/addresses/${address1Id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ isDefault: true })
        .expect(200);

      const listRes = await request(app.getHttpServer())
        .get('/users/me/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      const list = z.array(AddressResponseSchema).parse(listRes.body);
      const addr1 = list.find((a) => a.id === address1Id);
      const addr2 = list.find((a) => a.id === address2Id);

      expect(addr1?.isDefault).toBe(true);
      expect(addr2?.isDefault).toBe(false);
    });

    it('should delete shipping address via DELETE /users/me/addresses/:id', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/users/me/addresses/${address2Id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      const parsed = DeleteAddressResponseSchema.parse(res.body);
      expect(parsed.success).toBe(true);

      const listRes = await request(app.getHttpServer())
        .get('/users/me/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      const list = z.array(AddressResponseSchema).parse(listRes.body);
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe(address1Id);
    });

    it('should return 404 when deleting a non-existent address', async () => {
      await request(app.getHttpServer())
        .delete('/users/me/addresses/non-existent-id')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);
    });
  });

  describe('7. Logout Flow', () => {
    it('should successfully logout via POST /auth/logout and invalidate session', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      const parsed = SuccessResponseSchema.parse(res.body);
      expect(parsed.success).toBe(true);

      const rawCookies: unknown = res.headers['set-cookie'];
      expect(rawCookies).toBeDefined();

      // Subsequent access with that token fails with 401
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(401);
    });
  });
});
