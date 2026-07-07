import { Controller, Delete, Get, HttpCode, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { RecordService } from './record.service';

@Controller('api/records')
export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  @Get()
  getList() {
    return this.recordService.getRecordList();
  }

  @Post('start')
  @HttpCode(200)
  startRecording() {
    this.recordService.startRecording();
    return { success: true, recording: true };
  }

  @Post('stop')
  @HttpCode(200)
  stopRecording() {
    const file = this.recordService.stopRecording();
    return { success: true, file };
  }

  @Get('status')
  getStatus() {
    return { recording: this.recordService.isRecording() };
  }

  @Get(':id/export')
  exportRecord(@Param('id') id: string, @Res() res: Response) {
    const data = this.recordService.exportAsJson(id);
    if (!data) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="record_${id}.json"`);
    res.json(data);
  }

  @Delete(':id')
  @HttpCode(200)
  deleteRecord(@Param('id') id: string) {
    const deleted = this.recordService.deleteRecord(id);
    return { success: deleted };
  }
}
