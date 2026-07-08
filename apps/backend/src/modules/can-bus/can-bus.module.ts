import { Module } from '@nestjs/common';
import { FaultModule } from '../fault/fault.module';
import { RecordModule } from '../record/record.module';
import { CanBusGateway } from './can-bus.gateway';
import { CanBusService } from './can-bus.service';

@Module({
  imports: [FaultModule, RecordModule],
  providers: [CanBusService, CanBusGateway],
  exports: [CanBusService],
})
export class CanBusModule {}
