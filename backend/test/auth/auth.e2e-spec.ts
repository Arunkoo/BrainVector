import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { Server } from 'http';
import { AppModule } from '../../src/app.module';

// Define the structure of the response body for both register and login
// This structure is based on the 'Received value' in your error log.
interface UserResponse {
  id: string;
  name: string | null;
  email: string;
  role: string; // Expected: "User"
  createdAt: string;
  updatedAt: string;
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

    // Clean up database tables in the correct order due to foreign key constraints
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
    it('should register a new user and assign default role "User"', async () => {
      const registerData = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
      };

      const res = await request(httpServer)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      // Adapt the test to expect the raw User object in the body
      const body = res.body as UserResponse;

      // Check the user object details (directly on the body)
      expect(body).toHaveProperty('id');
      expect(body.email).toBe(registerData.email);
      expect(body.name).toBe(registerData.name);

      // *** Role Verification ***
      expect(body.role).toBe('User');
    });

    it('should fail if email already exists', async () => {
      await request(httpServer)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'test@example.com', // Duplicate email
          password: 'password123',
        })
        .expect(400); // BadRequestException for duplicate email
    });
  });

  // -------------------------------
  // Login Tests
  // -------------------------------
  describe('POST /api/auth/login', () => {
    it('should login with correct credentials, return user, and set cookie', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const res = await request(httpServer)
        .post('/api/auth/login')
        .send(loginData)
        .expect(201);

      // Adapt the test to expect the raw User object in the body
      const body = res.body as UserResponse;

      // The error log showed this structure, so we check it directly
      expect(body).toHaveProperty('id');
      expect(body.email).toBe(loginData.email);

      // *** Role Verification ***
      expect(body.role).toBe('User');

      // Check for the cookie (where the token is likely stored)
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
