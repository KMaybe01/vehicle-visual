import { Module } from '@nestjs/common';
import { FaultController } from './fault.controller';
import { FaultService } from './fault.service';

@Module({
  providers: [FaultService],
  controllers: [FaultController],
  exports: [FaultService],
})
export class FaultModule {}
