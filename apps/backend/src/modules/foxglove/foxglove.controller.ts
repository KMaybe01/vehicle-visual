import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import type { VehicleState } from '@vehicle-visual/can-simulator';
import { Response } from 'express';
import { RecordService } from '../record/record.service';
import { FoxgloveService } from './foxglove.service';

@Controller('api/foxglove')
export class FoxgloveController {
  constructor(
    private readonly foxgloveService: FoxgloveService,
    private readonly recordService: RecordService,
  ) {}

  @Get('status')
  getStatus() {
    return { live: true, port: 3101, protocol: 'foxglove-websocket' };
  }

  @Get('export/:recordId')
  async exportMcap(@Param('recordId') recordId: string, @Res() res: Response) {
    const data = this.recordService.exportAsJson(recordId);
    if (!data) throw new NotFoundException('Record not found');

    const states = data.map(
      (d): VehicleState => ({
        speed: d.speed,
        rpm: 0,
        coolantTemp: 0,
        batteryVoltage: 0,
        throttlePos: 0,
        brakePressed: d.brakePressed,
        steeringAngle: 0,
        odometer: 0,
        fuelLevel: 0,
        gearPosition: '',
        turnSignal: 'none',
        doorStatus: { frontLeft: false, frontRight: false, rearLeft: false, rearRight: false },
        tirePressure: { frontLeft: 0, frontRight: 0, rearLeft: 0, rearRight: 0 },
        faultCodes: d.faultCodes,
        timestamp: d.timestamp,
      }),
    );

    const mcap = await this.foxgloveService.exportToMcap(states);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="record_${recordId}.mcap"`);
    res.send(Buffer.from(mcap));
  }
}
