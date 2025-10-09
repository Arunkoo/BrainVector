import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { Server } from 'http';
import { AppModule } from '../../src/app.module';

interface RegisterResponse {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

describe('Auth E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: Server;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    // Set global prefix /api
    app.setGlobalPrefix('api');

    // Enable validation globally
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();

    httpServer = app.getHttpServer() as Server;

    prisma = app.get(PrismaService);

    await prisma.document.deleteMany();
    await prisma.workspaceMember.deleteMany();

    await prisma.workspace.deleteMany();

    await prisma.user.deleteMany();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  // -------------------------------
  // Register Tests
  // -------------------------------
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(httpServer)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);

      const body = res.body as RegisterResponse;
      expect(body).toHaveProperty('id');
      expect(body.email).toBe('test@example.com');
      expect(body.name).toBe('John Doe');
    });

    it('should fail if email already exists', async () => {
      await request(httpServer)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(400); // BadRequestException for duplicate email
    });
  });

  // -------------------------------
  // Login Tests
  // -------------------------------
  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const res = await request(httpServer)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);

      const body = res.body as RegisterResponse;
      expect(body).toHaveProperty('id');
      expect(body.email).toBe('test@example.com');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should fail if password is wrong', async () => {
      await request(httpServer)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401); // UnauthorizedException
    });
  });
});
