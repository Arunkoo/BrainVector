import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { Server } from 'http';
import { AppModule } from '../../src/app.module';

// Define the structure of the response body for both register and login
interface UserResponse {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

// --- Test Setup Variables ---
const TEST_USER_DATA = {
  name: 'John Doe',
  email: 'test@example.com',
  password: 'password123',
};
const LOGIN_DATA = {
  email: TEST_USER_DATA.email,
  password: TEST_USER_DATA.password,
};
const BASE_AUTH_URL = '/api/auth';

describe('Auth E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: Server;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();
    httpServer = app.getHttpServer() as Server;
    prisma = app.get(PrismaService);

    // Clean up database tables
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
  describe(`POST ${BASE_AUTH_URL}/register`, () => {
    it('should register a new user and assign default role "User"', async () => {
      // NOTE: This test creates the user necessary for the Login tests below
      const res = await request(httpServer)
        .post(`${BASE_AUTH_URL}/register`)
        .send(TEST_USER_DATA)
        .expect(HttpStatus.CREATED);

      const body = res.body as UserResponse;

      expect(body).toHaveProperty('id');
      expect(body.email).toBe(TEST_USER_DATA.email);
      expect(body.name).toBe(TEST_USER_DATA.name);
      expect(body.role).toBe('User');
    });

    it('should fail if email already exists', async () => {
      await request(httpServer)
        .post(`${BASE_AUTH_URL}/register`)
        .send(TEST_USER_DATA)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  // -------------------------------
  // Login Tests
  // -------------------------------
  describe(`POST ${BASE_AUTH_URL}/login`, () => {
    it('should login with correct credentials, return user, and set cookie', async () => {
      const res = await request(httpServer)
        .post(`${BASE_AUTH_URL}/login`)
        .send(LOGIN_DATA)

        .expect(HttpStatus.CREATED)
        .expect('set-cookie', /jwt=/i);

      const body = res.body as UserResponse;

      expect(body).toHaveProperty('id');
      expect(body.email).toBe(LOGIN_DATA.email);
      expect(body.role).toBe('User');
    });

    it('should fail if password is wrong', async () => {
      await request(httpServer)
        .post(`${BASE_AUTH_URL}/login`)
        .send({
          email: LOGIN_DATA.email,
          password: 'wrongpassword',
        })
        .expect(HttpStatus.UNAUTHORIZED); // 401 for bad credentials
    });
  });
});
