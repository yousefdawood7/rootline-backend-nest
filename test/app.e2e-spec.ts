import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppInfoSchema } from '../src/app.dto';
import { AppModule } from '../src/app.module';
import { ErrorResponseSchema } from '../src/common/dto/error-response.dto';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { HealthResponseSchema } from '../src/modules/health/dto/health-response.dto';

describe('Rootline API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / should return application info', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);
    const parsed = AppInfoSchema.parse(response.body);

    expect(parsed).toEqual({
      name: 'rootline-backend-nest',
      version: '0.0.1',
      docs: '/docs',
    });
  });

  it('GET /health should return 200 with database health check', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
    const parsed = HealthResponseSchema.parse(response.body);

    expect(parsed.status).toBe('ok');
    expect(parsed.info).toBeDefined();
    expect(parsed.info?.database?.status).toBe('up');
  });

  it('should attach X-Request-Id header to responses', async () => {
    const customRequestId = 'test-request-id-12345';
    const response = await request(app.getHttpServer())
      .get('/')
      .set('X-Request-Id', customRequestId)
      .expect(200);

    expect(response.headers['x-request-id']).toBe(customRequestId);
  });

  it('GET /non-existent-route should return unified error shape', async () => {
    const response = await request(app.getHttpServer())
      .get('/non-existent-route')
      .expect(404);
    const parsed = ErrorResponseSchema.parse(response.body);

    expect(parsed.statusCode).toBe(404);
    expect(parsed.code).toBe('NOT_FOUND');
    expect(parsed.message).toBeDefined();
    expect(parsed.requestId).toBeDefined();
    expect(parsed.timestamp).toBeDefined();
  });
});
