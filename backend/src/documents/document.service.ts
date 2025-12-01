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
  private readonly safeUserSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
  };

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
      include: {
        createdBy: {
          select: this.safeUserSelect,
        },
      },
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
      include: { createdBy: { select: this.safeUserSelect } },
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
      include: { createdBy: { select: this.safeUserSelect } },
    });
  }

  //update documents...
  async UpdateDocument(
    userId: string,
    workspaceId: string,
    documentId: string,
    dto: UpdateDocumentDto,
  ) {
    await this.checkWorkspaceMembership(userId, workspaceId);
    const existingDocument = await this.prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!existingDocument) {
      throw new NotFoundException(`Document with ID "${documentId}" not found`);
    }
    if (existingDocument.workspaceId != workspaceId) {
      throw new ForbiddenException(
        `Document does not belong to this workspace`,
      );
    }
    const updatedDocument = await this.prisma.document.update({
      where: { id: documentId },
      data: dto,
    });

    return updatedDocument;
  }

  //delete Documents....
  async deleteDocument(
    userId: string,
    workspaceId: string,
    documentId: string,
  ) {
    const membership = await this.checkWorkspaceMembership(userId, workspaceId);
    const document = await this.prisma.document.findUnique({
      where: { id: documentId, workspaceId: workspaceId },
    });
    if (!document) {
      throw new NotFoundException('Document not found.');
    }

    //Authorization check....
    const isOwner = membership.role === 'Owner';
    const isCreator = document.createdById === userId;

    if (!isOwner && !isCreator) {
      throw new ForbiddenException(
        'You must be the document creator or a workspace owner to delete this document.',
      );
    }

    await this.prisma.document.delete({
      where: { id: documentId },
    });

    return { message: 'Document successfully deleted.' };
  }
}
