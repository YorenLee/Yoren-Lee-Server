import { Global, Module } from '@nestjs/common';
import { VectorDBService } from './vectorDB.service';

@Global()
@Module({
  providers: [VectorDBService],
  exports: [VectorDBService],
})
export class VectorDBModule {}
