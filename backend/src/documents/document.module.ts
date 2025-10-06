import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DocumentService } from './document.service';

@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
