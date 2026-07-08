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
  302: { desc: '2缸失火检测', level: 'severe' },
  303: { desc: '3缸失火检测', level: 'severe' },
  401: { desc: 'EGR流量不足', level: 'moderate' },
  502: { desc: '怠速控制系统故障', level: 'minor' },
  601: { desc: '电池电压低', level: 'minor' },
  701: { desc: '变速箱油温过高', level: 'moderate' },
};

@Injectable()
export class FaultService {
  private readonly logger = new Logger(FaultService.name);
  private faults: FaultRecord[] = [];
  private faultTimeline: { time: number; code: number; action: 'set' | 'clear' }[] = [];

  addFault(code: number) {
    const info = FAULT_DESCRIPTIONS[code];
    if (!info) return;

    const existing = this.faults.find((f) => f.code === code && !f.cleared);
    if (existing) return;

    const now = Date.now();
    const record: FaultRecord = {
      code,
      description: info.desc,
      level: info.level,
      timestamp: now,
      cleared: false,
    };

    this.faults.push(record);
    this.faultTimeline.push({ time: now, code, action: 'set' });
    this.logger.warn(`Fault detected: [${code}] ${info.desc} (${info.level})`);
  }

  clearFault(code: number) {
    const fault = this.faults.find((f) => f.code === code && !f.cleared);
    if (fault) {
      fault.cleared = true;
      this.faultTimeline.push({ time: Date.now(), code, action: 'clear' });
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
    const byCode: Record<number, number> = {};
    this.faults.forEach((f) => {
      byCode[f.code] = (byCode[f.code] || 0) + 1;
    });
    return {
      total: this.faults.length,
      active: active.length,
      severe: active.filter((f) => f.level === 'severe').length,
      moderate: active.filter((f) => f.level === 'moderate').length,
      minor: active.filter((f) => f.level === 'minor').length,
      byCode,
    };
  }

  getFaultTimeline(since: number = Date.now() - 600000) {
    return this.faultTimeline.filter((e) => e.time >= since);
  }
}
