import { Module } from '@nestjs/common';
import { CanBusModule } from '../can-bus/can-bus.module';
import { RecordModule } from '../record/record.module';
import { FoxgloveController } from './foxglove.controller';
import { FoxgloveService } from './foxglove.service';

@Module({
  imports: [CanBusModule, RecordModule],
  controllers: [FoxgloveController],
  providers: [FoxgloveService],
  exports: [FoxgloveService],
})
export class FoxgloveModule {}
