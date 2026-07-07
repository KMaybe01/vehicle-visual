import { Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { FaultService } from './fault.service';

@Controller('api/faults')
export class FaultController {
  constructor(private readonly faultService: FaultService) {}

  @Get()
  getAll() {
    return this.faultService.getFaultHistory();
  }

  @Get('active')
  getActive() {
    return this.faultService.getActiveFaults();
  }

  @Get('stats')
  getStats() {
    return this.faultService.getFaultStats();
  }

  @Post(':code/clear')
  @HttpCode(200)
  clearFault(@Param('code') code: string) {
    this.faultService.clearFault(Number(code));
    return { success: true };
  }

  @Delete('clear-all')
  @HttpCode(200)
  clearAll() {
    this.faultService.clearAllFaults();
    return { success: true };
  }
}
