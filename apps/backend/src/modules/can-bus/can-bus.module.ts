import { Module } from '@nestjs/common';
import { CanBusGateway } from './can-bus.gateway';
import { CanBusService } from './can-bus.service';

@Module({
  providers: [CanBusService, CanBusGateway],
  exports: [CanBusService],
})
export class CanBusModule {}
