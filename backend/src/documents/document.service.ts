import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDocumentDto } from './dto/document.dto';
import { UpdateDocumentDto } from './dto/updateDocument.dto';

@Injectable()
export class DocumentService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // Helper function to check if user is a member (any role) of workspace..
  private async checkWorkspaceMembership(userId: string, workspaceId: string) {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        userId: userId,
        WorkspaceId: workspaceId,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You are not a member of this worspace or the workspace does not exist.',
      );
    }
    return membership;
  }

  //create document under specified workspace..
  async createDocument(
    userId: string,
    workspaceId: string,
    dto: CreateDocumentDto,
  ) {
    await this.checkWorkspaceMembership(userId, workspaceId);

    return this.prisma.document.create({
      data: {
        title: dto.title,
        content: dto.content || '',
        workspace: { connect: { id: workspaceId } },
        createdBy: { connect: { id: userId } },
      },
      include: { createdBy: true },
    });
  }

  //find one document...
  async findOne(userId: string, workspaceId: string, documentId: string) {
    await this.checkWorkspaceMembership(userId, workspaceId);

    const document = await this.prisma.document.findUnique({
      where: {
        id: documentId,
        workspaceId: workspaceId,
      },
      include: { createdBy: true },
    });

    if (!document) {
      throw new NotFoundException(
        `Document with Id "${documentId}" not found in workspace with id as "${workspaceId}"`,
      );
    }
    return document;
  }

  //find all documents...
  async findAll(userId: string, workspaceId: string) {
    await this.checkWorkspaceMembership(userId, workspaceId);

    return this.prisma.document.findMany({
      where: { workspaceId: workspaceId },
      orderBy: {
        updatedAt: 'desc',
      },
      include: { createdBy: true },
    });
  }

  //update documents...
  async UpdateDocument(documentId: string, dto: UpdateDocumentDto) {
    // TODO: REAL TIME COLLABORATION..
    const updatedDocument = await this.prisma.document.update({
      where: { id: documentId },
      data: dto,
    });

    return updatedDocument;
  }
}
