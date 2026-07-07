import { Injectable, Logger } from '@nestjs/common';
import type { VehicleState } from '@vehicle-visual/can-simulator';

export interface RecordFile {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  sampleCount: number;
  size: number;
}

export interface RecordEntry {
  timestamp: number;
  speed: number;
  rpm: number;
  coolantTemp: number;
  batteryVoltage: number;
  throttlePos: number;
  brakePressed: boolean;
  faultCodes: number[];
}

@Injectable()
export class RecordService {
  private readonly logger = new Logger(RecordService.name);
  private buffer: RecordEntry[] = [];
  private records: RecordFile[] = [];
  private recording = false;
  private recordStartTime = 0;
  private recordId = 0;

  startRecording() {
    if (this.recording) return;
    this.recording = true;
    this.recordStartTime = Date.now();
    this.buffer = [];
    this.recordId++;
    this.logger.log('Recording started');
  }

  stopRecording(): RecordFile | null {
    if (!this.recording) return null;
    this.recording = false;

    const file: RecordFile = {
      id: `rec_${this.recordId}_${this.recordStartTime}`,
      name: `record_${new Date(this.recordStartTime).toISOString().replace(/[:.]/g, '-')}.json`,
      startTime: this.recordStartTime,
      endTime: Date.now(),
      duration: Date.now() - this.recordStartTime,
      sampleCount: this.buffer.length,
      size: JSON.stringify(this.buffer).length,
    };

    this.records.push(file);
    this.logger.log(`Recording stopped: ${file.name} (${file.sampleCount} samples)`);
    return file;
  }

  isRecording(): boolean {
    return this.recording;
  }

  addSample(state: VehicleState) {
    if (!this.recording) return;
    this.buffer.push({
      timestamp: state.timestamp,
      speed: state.speed,
      rpm: state.rpm,
      coolantTemp: state.coolantTemp,
      batteryVoltage: state.batteryVoltage,
      throttlePos: state.throttlePos,
      brakePressed: state.brakePressed,
      faultCodes: state.faultCodes,
    });
  }

  getRecordList(): RecordFile[] {
    return [...this.records].sort((a, b) => b.startTime - a.startTime);
  }

  getRecordingBuffer(): RecordEntry[] {
    return [...this.buffer];
  }

  getRecordById(id: string): RecordFile | undefined {
    return this.records.find((r) => r.id === id);
  }

  deleteRecord(id: string): boolean {
    const index = this.records.findIndex((r) => r.id === id);
    if (index !== -1) {
      this.records.splice(index, 1);
      return true;
    }
    return false;
  }

  exportAsJson(id: string): RecordEntry[] | null {
    const record = this.getRecordById(id);
    if (!record) return null;
    return this.getRecordingBuffer();
  }
}
