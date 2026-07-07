import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CanBusModule } from './modules/can-bus/can-bus.module';
import { ConfigModule } from './modules/config/config.module';
import { FaultModule } from './modules/fault/fault.module';
import { RecordModule } from './modules/record/record.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqljs',
      location: './database/vehicle.db',
      synchronize: true,
      autoLoadEntities: true,
    }),
    CanBusModule,
    FaultModule,
    RecordModule,
    ConfigModule,
  ],
})
export class AppModule {}
