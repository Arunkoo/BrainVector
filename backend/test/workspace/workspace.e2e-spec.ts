import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'http';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import request, { SuperAgentTest } from 'supertest';
import { CreateWorkspaceDto } from '../../src/workspaces/dto/create-workspace.dto';
import { WorkspaceRole } from '@prisma/client';
import { InviteUserDto } from 'src/workspaces/dto/invite-user.dto';
import cookieParser from 'cookie-parser';

interface CreateWorkspaceResponse {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceResponse {
  id: string;
  role: WorkspaceRole;
  workspace: CreateWorkspaceResponse;
}
interface authResponse {
  id: string;
}

const BASE_URL = '/api/workspace';
const USER1_DATA = {
  name: 'Arun',
  email: 'Arun@test.com',
  password: 'password123',
};
const USER2_DATA = {
  name: 'Aman',
  email: 'Aman@test.com',
  password: 'securepass',
};

describe('WorkspaceController (E2E with Cookie Auth)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let httpServer: Server;

  let arunAgent: SuperAgentTest;
  let arunUserId: string;
  let amanUserId: string;

  let targetWorkspaceId: string;

  let arunAuthCookie: string | undefined;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());

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

    const resArun = await request(httpServer)
      .post('/api/auth/register')
      .send(USER1_DATA);
    arunUserId = (resArun.body as authResponse).id;

    const resAman = await request(httpServer)
      .post('/api/auth/register')
      .send(USER2_DATA);
    amanUserId = (resAman.body as authResponse).id;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    arunAgent = request.agent(httpServer) as any;

    const loginRes = await arunAgent
      .post('/api/auth/login')
      .send({ email: USER1_DATA.email, password: USER1_DATA.password });

    if (loginRes.status !== 201) {
      console.error('FATAL LOGIN ERROR:', loginRes.status, loginRes.body);
      throw new Error(`Arun login failed with status ${loginRes.status}`);
    }

    const header = loginRes.headers['set-cookie'];
    const rawSetCookie: string[] = Array.isArray(header)
      ? header
      : header
        ? [header]
        : [];

    expect(rawSetCookie.length).toBeGreaterThan(0);

    arunAuthCookie = rawSetCookie.map((c) => c.split(';')[0]).join('; ');
    expect(arunAuthCookie).toBeDefined();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  // ---------------- Unauthorized Tests ----------------
  describe('Unauthorized Access', () => {
    it('should return 401 for POST /api/workspace without cookie', async () => {
      const dto: CreateWorkspaceDto = { name: 'Unauthorized Workspace' };
      await request(httpServer)
        .post(BASE_URL)
        .send(dto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 for GET /api/workspace without cookie', async () => {
      await request(httpServer).get(BASE_URL).expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // ---------------- Create Workspace ----------------
  describe('POST /api/workspace', () => {
    const workspaceName = 'BRAIN VECTOR EXAMPLE WORKSPACE';
    const dto: CreateWorkspaceDto = { name: workspaceName };

    it('should create new workspace and set the user as Owner', async () => {
      const res = await arunAgent
        .post(BASE_URL)
        .set('Cookie', arunAuthCookie as string)
        .send(dto)
        .expect(HttpStatus.CREATED);

      const body = res.body as CreateWorkspaceResponse;
      targetWorkspaceId = body.id;

      console.log('DEBUG: Target Workspace ID set to:', targetWorkspaceId);

      expect(body).toHaveProperty('id');
      expect(body.name).toBe(workspaceName);
      expect(body.ownerId).toBe(arunUserId);
      const member = await prisma.workspaceMember.findUnique({
        where: {
          userId_WorkspaceId: {
            userId: arunUserId,

            WorkspaceId: targetWorkspaceId,
          },
        },
      });
      expect(member).toBeDefined();
      expect(member?.role).toBe(WorkspaceRole.Owner);
    });

    it('should return 400 if validation fails (missing name)', async () => {
      await arunAgent
        .post(BASE_URL)
        .set('Cookie', arunAuthCookie as string)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  // ---------------- Get Workspaces ----------------
  describe('GET /api/workspace', () => {
    it('should return a list of workspaces the user is a member of', async () => {
      await arunAgent
        .post(BASE_URL)
        .set('Cookie', arunAuthCookie as string)
        .send({ name: 'Arun second workspace' });

      const res = await arunAgent
        .get(BASE_URL)
        .set('Cookie', arunAuthCookie as string)
        .expect(HttpStatus.OK);

      const workspaces = res.body as WorkspaceResponse[];

      console.log(
        'DEBUG: Full first workspace object:',
        JSON.stringify(workspaces[0], null, 2),
      );

      console.log(
        'DEBUG: Workspaces returned:',
        workspaces.map((w) => w.workspace.name),
      );

      expect(Array.isArray(workspaces)).toBe(true);
      expect(workspaces.length).toBeGreaterThanOrEqual(2);

      expect(
        workspaces.some(
          (w) => w.workspace.name === 'BRAIN VECTOR EXAMPLE WORKSPACE',
        ),
      ).toBe(true);
      expect(
        workspaces.some((w) => w.workspace.name === 'Arun second workspace'),
      ).toBe(true);
    });
  });

  // ---------------- Invite User ----------------
  describe('POST /api/workspace/:workspaceId/invite', () => {
    it('should successfully invite Aman to the workspace with default role "Viewer"', async () => {
      const inviteData: InviteUserDto = { invitedUserId: amanUserId };

      console.log(
        'DEBUG: Attempting to invite Aman (ID:',
        amanUserId,
        ') to Workspace ID:',
        targetWorkspaceId,
      );

      const res = await arunAgent
        .post(`${BASE_URL}/${targetWorkspaceId}/invite`)
        .set('Cookie', arunAuthCookie as string)
        .send(inviteData);

      if (res.status !== 201) {
        console.error(
          `FATAL: Invite failed with status ${res.status}. Response Body:`,
          res.body,
        );
        throw new Error(
          `Invite failed. Expected 201, got ${res.status}. Check console for body.`,
        );
      }

      const body = res.body as authResponse;
      expect(body).toHaveProperty('id');

      expect(body.id).toBe(amanUserId);

      const member = await prisma.workspaceMember.findUnique({
        where: {
          userId_WorkspaceId: {
            userId: amanUserId,
            WorkspaceId: targetWorkspaceId,
          },
        },
      });

      expect(member).toBeDefined();
      expect(member?.role).toBe(WorkspaceRole.Viewer);
    });

    it('should return 409 (Conflict) if User is already a member', async () => {
      const inviteData: InviteUserDto = { invitedUserId: amanUserId };

      await arunAgent
        .post(`${BASE_URL}/${targetWorkspaceId}/invite`)
        .set('Cookie', arunAuthCookie as string)
        .send(inviteData)
        .expect(HttpStatus.CONFLICT);
    });

    it('should return 400 if validation fails (missing invitedUserId)', async () => {
      await arunAgent
        .post(`${BASE_URL}/${targetWorkspaceId}/invite`)
        .set('Cookie', arunAuthCookie as string)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 404 for an invalid workspace ID format (or 400 if validation is earlier)', async () => {
      const invalidId = 'a-fake-and-invalid-uuid';
      await arunAgent
        .post(`${BASE_URL}/${invalidId}/invite`)
        .set('Cookie', arunAuthCookie as string)
        .send({ invitedUserId: arunUserId })
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
