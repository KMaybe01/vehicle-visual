import { memo } from 'react';
import TrendChart from '../../pages/dashboard-2d/TrendChart';
import type { VehicleState } from '../../types';
import type { PanelComponentProps } from '../types';

function TrendPanel({ config, data }: PanelComponentProps) {
  const history = data as VehicleState[] | null;
  if (!history || history.length < 2)
    return <div className="panel-placeholder">等待历史数据...</div>;

  const settings = config.settings as {
    dataKey: keyof VehicleState;
    color: string;
    unit: string;
    label: string;
  };

  return (
    <div className="trend-panel">
      <TrendChart
        data={history}
        dataKey={settings.dataKey as 'speed' | 'rpm' | 'coolantTemp' | 'batteryVoltage'}
        color={settings.color}
        unit={settings.unit}
      />
    </div>
  );
}

export default memo(TrendPanel);
