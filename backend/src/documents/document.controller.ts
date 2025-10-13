import { AuthGuard } from '@nestjs/passport';
import { DocumentService } from './document.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { CustomRequest } from 'src/common/types/request.interface';
import { CreateDocumentDto } from './dto/document.dto';
import { UpdateDocumentDto } from './dto/updateDocument.dto';

@Controller('workspace/:workspaceId/document')
@UseGuards(AuthGuard('jwt'))
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  //create a new document...
  @Post()
  createDocs(
    @Req() req: CustomRequest,
    @Param('workspaceId') workspaceId: string,
    @Body() createDocumentDto: CreateDocumentDto,
  ) {
    return this.documentService.createDocument(
      req.user.userId,
      workspaceId,
      createDocumentDto,
    );
  }

  //find one document..
  @Get(':documentId')
  findOneDocs(
    @Req() req: CustomRequest,
    @Param('workspaceId') workspaceId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.documentService.findOne(
      req.user.userId,
      workspaceId,
      documentId,
    );
  }

  //find all documents....
  @Patch(':documentId')
  updateDocs(
    @Req() req: CustomRequest,
    @Param('workspaceId') workspaceId: string,
    @Param('documentId') documentId: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentService.UpdateDocument(
      req.user.userId,
      workspaceId,
      documentId,
      updateDocumentDto,
    );
  }

  //delete...
  @Delete(':documentId')
  deleteDocs(
    @Req() req: CustomRequest,
    @Param('workspaceId') workspaceId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.documentService.deleteDocument(
      req.user.userId,
      workspaceId,
      documentId,
    );
  }
}
