import { Injectable, Logger } from '@nestjs/common';

export interface FaultRecord {
  code: number;
  description: string;
  level: 'minor' | 'moderate' | 'severe';
  timestamp: number;
  cleared: boolean;
}

const FAULT_DESCRIPTIONS: Record<number, { desc: string; level: FaultRecord['level'] }> = {
  101: { desc: 'MAF传感器电路范围/性能故障', level: 'moderate' },
  300: { desc: '检测到随机/多缸失火', level: 'severe' },
  420: { desc: '催化转换器效率低于阈值', level: 'moderate' },
  501: { desc: '车速传感器电路故障', level: 'moderate' },
  102: { desc: '进气温度传感器电路故障', level: 'minor' },
  301: { desc: '1缸失火检测', level: 'severe' },
};

@Injectable()
export class FaultService {
  private readonly logger = new Logger(FaultService.name);
  private faults: FaultRecord[] = [];

  addFault(code: number) {
    const info = FAULT_DESCRIPTIONS[code];
    if (!info) return;

    const existing = this.faults.find((f) => f.code === code && !f.cleared);
    if (existing) return;

    const record: FaultRecord = {
      code,
      description: info.desc,
      level: info.level,
      timestamp: Date.now(),
      cleared: false,
    };

    this.faults.push(record);
    this.logger.warn(`Fault detected: [${code}] ${info.desc} (${info.level})`);
  }

  clearFault(code: number) {
    const fault = this.faults.find((f) => f.code === code && !f.cleared);
    if (fault) {
      fault.cleared = true;
      this.logger.log(`Fault cleared: ${code}`);
    }
  }

  clearAllFaults() {
    this.faults.forEach((f) => {
      if (!f.cleared) f.cleared = true;
    });
    this.logger.log('All faults cleared');
  }

  getActiveFaults(): FaultRecord[] {
    return this.faults.filter((f) => !f.cleared);
  }

  getFaultHistory(): FaultRecord[] {
    return [...this.faults].sort((a, b) => b.timestamp - a.timestamp);
  }

  getFaultStats() {
    const active = this.getActiveFaults();
    return {
      total: this.faults.length,
      active: active.length,
      severe: active.filter((f) => f.level === 'severe').length,
      moderate: active.filter((f) => f.level === 'moderate').length,
      minor: active.filter((f) => f.level === 'minor').length,
    };
  }
}
