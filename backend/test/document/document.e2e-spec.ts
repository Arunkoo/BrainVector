import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';

import { Server } from 'http';

import { PrismaService } from '../../src/prisma/prisma.service';
import request, { SuperAgentTest } from 'supertest';
import cookieParser from 'cookie-parser';
import { WorkspaceRole } from '@prisma/client';
import { createTestModule } from '../setUp';

// --- Interfaces & Types (mimicking service/controller response) ---
interface AuthResponse {
  id: string;
}

// NOTE: This interface handles both Document data and the successful DELETE message response.
interface DocumentResponse {
  id: string;
  title: string;
  content: string;
  workspaceId: string;
  createdById: string;
  message: string;
}

// --- Test Setup Constants ---
const BASE_URL = '/api/workspace';
const USER1_DATA = {
  name: 'Arun (Owner)',
  email: 'arun.doc.test@test.com',
  password: 'password123',
};
const USER2_DATA = {
  name: 'Aman (Viewer)',
  email: 'aman.doc.test@test.com',
  password: 'securepass',
};
const WORKSPACE_DTO = { name: 'E2E Document Test Workspace' };
const CREATE_DOCUMENT_DTO = {
  title: 'E2E Test Document',
  content: 'Content that will be updated.',
};

// --- Global Variables for Test Context ---
let app: INestApplication;
let prisma: PrismaService;
let httpServer: Server;

let arunAgent: SuperAgentTest;
let amanAgent: SuperAgentTest;

let arunUserId: string;
let amanUserId: string;
let targetWorkspaceId: string;
let targetDocumentId: string;
let DOC_BASE_URL: string; // Changed to 'let' and initialized within beforeAll

describe('DocumentController (E2E Integrated)', () => {
  beforeAll(async () => {
    const moduleRef = await createTestModule().compile();

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

    // 1. Clean up database
    await prisma.document.deleteMany();
    await prisma.workspaceMember.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.user.deleteMany();

    // 2. Register Users
    const resArun = await request(httpServer)
      .post('/api/auth/register')
      .send(USER1_DATA);
    arunUserId = (resArun.body as AuthResponse).id;
    const resAman = await request(httpServer)
      .post('/api/auth/register')
      .send(USER2_DATA);
    amanUserId = (resAman.body as AuthResponse).id;

    // 3. Login Users and get SuperAgentTest instances
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    arunAgent = request.agent(httpServer) as any;
    await arunAgent
      .post('/api/auth/login')
      .send({ email: USER1_DATA.email, password: USER1_DATA.password });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    amanAgent = request.agent(httpServer) as any;
    await amanAgent
      .post('/api/auth/login')
      .send({ email: USER2_DATA.email, password: USER2_DATA.password });

    // 4. Create Workspace (Arun is the owner)
    const wsRes = await arunAgent
      .post(BASE_URL)
      .send(WORKSPACE_DTO)
      .expect(HttpStatus.CREATED);

    const body = wsRes.body as DocumentResponse;
    targetWorkspaceId = body.id;

    // FIX: Initialize DOC_BASE_URL here, after targetWorkspaceId is correctly defined.
    DOC_BASE_URL = `${BASE_URL}/${targetWorkspaceId}/document`;

    // 5. Invite Aman to the workspace as Viewer (for permission tests)
    await arunAgent
      .post(`${BASE_URL}/${targetWorkspaceId}/invite`)
      .send({ invitedUserId: amanUserId, role: WorkspaceRole.Viewer });
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  // DOC_BASE_URL is now correctly initialized in beforeAll

  // ---------------- Unauthorized Access Tests (Basic Guard Check) ----------------
  describe('Unauthorized Access', () => {
    it('should return 401 for POST without authentication', async () => {
      await request(httpServer)
        .post(DOC_BASE_URL)
        .send(CREATE_DOCUMENT_DTO)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // ---------------- POST /workspace/:workspaceId/document (createDocs) ----------------
  describe(`POST ${DOC_BASE_URL} (createDocs)`, () => {
    it('should successfully create a new document in the workspace (Arun is Owner)', async () => {
      const res = await arunAgent
        .post(DOC_BASE_URL)
        .send(CREATE_DOCUMENT_DTO)
        .expect(HttpStatus.CREATED);

      const body = res.body as DocumentResponse;
      targetDocumentId = body.id; // Store ID for subsequent tests

      expect(body).toHaveProperty('id');
      expect(body.title).toBe(CREATE_DOCUMENT_DTO.title);
      expect(body.createdById).toBe(arunUserId);
      expect(body.workspaceId).toBe(targetWorkspaceId);

      // Verify creation in DB
      const dbDoc = await prisma.document.findUnique({
        where: { id: targetDocumentId },
      });
      expect(dbDoc).toBeDefined();
    });

    it('should return 403 Forbidden if user is NOT a member of the workspace (e.g., trying a fake WS ID)', async () => {
      // Arun attempts to create a document in a non-existent/unjoined workspace
      await arunAgent
        .post(`${BASE_URL}/non-existent-ws-123/document`)
        .send(CREATE_DOCUMENT_DTO)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  // ---------------- GET /workspace/:workspaceId/document/:documentId (findOneDocs) ----------------
  describe(`GET ${DOC_BASE_URL}/:documentId (findOneDocs)`, () => {
    it('should successfully find the document (Arun is Owner)', async () => {
      const res = await arunAgent
        .get(`${DOC_BASE_URL}/${targetDocumentId}`)
        .expect(HttpStatus.OK);

      const body = res.body as DocumentResponse;
      expect(body.id).toBe(targetDocumentId);
      expect(body.title).toBe(CREATE_DOCUMENT_DTO.title);
    });

    it('should successfully find the document (Aman is Viewer/Member)', async () => {
      // Aman is a member, so read access should be granted
      await amanAgent
        .get(`${DOC_BASE_URL}/${targetDocumentId}`)
        .expect(HttpStatus.OK);
    });

    it('should return 404 Not Found if document ID does not exist', async () => {
      await arunAgent
        .get(`${DOC_BASE_URL}/non-existent-doc-999`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  // ---------------- PATCH /workspace/:workspaceId/document/:documentId (updateDocs) ----------------
  describe(`PATCH ${DOC_BASE_URL}/:documentId (updateDocs)`, () => {
    const updateDto = { content: 'This content is updated by Arun!' };

    it('should successfully update a document (Arun is Owner/Creator)', async () => {
      const res = await arunAgent
        .patch(`${DOC_BASE_URL}/${targetDocumentId}`)
        .send(updateDto)
        .expect(HttpStatus.OK);
      const body = res.body as DocumentResponse;
      expect(body.content).toBe(updateDto.content);

      // Verify update in DB (since service is real)
      const dbDoc = await prisma.document.findUnique({
        where: { id: targetDocumentId },
      });
      expect(dbDoc?.content).toBe(updateDto.content);
    });

    it('should return 404 Not Found if document ID is invalid (from service)', async () => {
      await arunAgent
        .patch(`${DOC_BASE_URL}/non-existent-doc-999`)
        .send(updateDto)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  // ---------------- DELETE /workspace/:workspaceId/document/:documentId (deleteDocs) ----------------
  describe(`DELETE ${DOC_BASE_URL}/:documentId (deleteDocs)`, () => {
    // We need a fresh document for the deletion test
    let docToDeleteId: string;

    beforeAll(async () => {
      // Create a new document for this block's tests
      const res = await arunAgent
        .post(DOC_BASE_URL)
        .send({ title: 'Doc for Deletion', content: '' })
        .expect(HttpStatus.CREATED);
      const body = res.body as DocumentResponse;
      docToDeleteId = body.id;
    });

    it('should return 403 Forbidden if user lacks permission (Aman is Viewer and NOT Creator)', async () => {
      // Aman is a Viewer and not the creator (Arun is), so deletion should fail.
      await amanAgent
        .delete(`${DOC_BASE_URL}/${docToDeleteId}`)
        .expect(HttpStatus.FORBIDDEN);

      // Ensure document still exists
      const dbDoc = await prisma.document.findUnique({
        where: { id: docToDeleteId },
      });
      expect(dbDoc).toBeDefined();
    });

    it('should successfully delete a document if user is the Creator (Arun)', async () => {
      // Arun is the creator and owner, so deletion should succeed.
      await arunAgent
        .delete(`${DOC_BASE_URL}/${docToDeleteId}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          const body = res.body as DocumentResponse;
          expect(body.message).toBe('Document successfully deleted.');
        });

      // Verify deletion in DB
      const dbDoc = await prisma.document.findUnique({
        where: { id: docToDeleteId },
      });
      expect(dbDoc).toBeNull();
    });

    it('should return 404 Not Found if the document does not exist', async () => {
      await arunAgent
        .delete(`${DOC_BASE_URL}/non-existent-doc-999`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
