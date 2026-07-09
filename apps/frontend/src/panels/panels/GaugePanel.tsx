import { memo } from 'react';
import GaugeChart from '../../pages/dashboard-2d/GaugeChart';
import type { VehicleState } from '../../types';
import type { PanelComponentProps } from '../types';

type MetricKey = keyof Pick<
  VehicleState,
  'speed' | 'rpm' | 'coolantTemp' | 'batteryVoltage' | 'throttlePos' | 'fuelLevel'
>;

const METRIC_CONFIG: Record<
  MetricKey,
  { label: string; unit: string; min: number; max: number; color: string }
> = {
  speed: { label: '车速', unit: 'km/h', min: 0, max: 180, color: '#3b82f6' },
  rpm: { label: '发动机转速', unit: 'r/min', min: 0, max: 8000, color: '#22c55e' },
  coolantTemp: { label: '冷却液温度', unit: '°C', min: 0, max: 120, color: '#eab308' },
  batteryVoltage: { label: '电池电压', unit: 'V', min: 8, max: 16, color: '#06b6d4' },
  throttlePos: { label: '油门开度', unit: '%', min: 0, max: 100, color: '#a78bfa' },
  fuelLevel: { label: '油量', unit: '%', min: 0, max: 100, color: '#f97316' },
};

function GaugePanel({ config, data }: PanelComponentProps) {
  const vehicle = data as VehicleState | null;
  if (!vehicle) return <div className="panel-placeholder">等待数据...</div>;

  const metrics = (config.settings.metrics as MetricKey[]) ?? [
    'speed',
    'rpm',
    'coolantTemp',
    'batteryVoltage',
  ];

  return (
    <div
      className="gauges-row"
      style={{ gridTemplateColumns: `repeat(${Math.min(metrics.length, 4)}, 1fr)` }}
    >
      {metrics.map((key) => {
        const cfg = METRIC_CONFIG[key];
        if (!cfg) return null;
        const value = vehicle[key] as number;
        const color = key === 'coolantTemp' && vehicle.coolantTemp > 95 ? '#ef4444' : cfg.color;
        return (
          <GaugeChart
            key={key}
            label={cfg.label}
            value={value}
            unit={cfg.unit}
            min={cfg.min}
            max={cfg.max}
            color={color}
          />
        );
      })}
    </div>
  );
}

export default memo(GaugePanel);
