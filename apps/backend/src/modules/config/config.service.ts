import { Injectable } from '@nestjs/common';

export interface SystemConfig {
  refreshInterval: number;
  maxSpeed: number;
  maxRpm: number;
  alarmThresholds: {
    coolantTemp: { warning: number; critical: number };
    batteryVoltage: { warning: number; critical: number };
    rpm: { warning: number; critical: number };
  };
}

const DEFAULT_CONFIG: SystemConfig = {
  refreshInterval: 50,
  maxSpeed: 180,
  maxRpm: 8000,
  alarmThresholds: {
    coolantTemp: { warning: 95, critical: 105 },
    batteryVoltage: { warning: 11.5, critical: 10.5 },
    rpm: { warning: 6000, critical: 7000 },
  },
};

@Injectable()
export class ConfigService {
  private config: SystemConfig = { ...DEFAULT_CONFIG };

  getConfig(): SystemConfig {
    return { ...this.config };
  }

  updateConfig(partial: Partial<SystemConfig>): SystemConfig {
    this.config = { ...this.config, ...partial };
    return this.getConfig();
  }

  resetConfig(): SystemConfig {
    this.config = { ...DEFAULT_CONFIG };
    return this.getConfig();
  }
}
