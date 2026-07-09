import { memo } from 'react';
import VehicleStatus from '../../pages/dashboard-2d/VehicleStatus';
import type { VehicleState } from '../../types';
import type { PanelComponentProps } from '../types';

function StatusPanel({ data }: PanelComponentProps) {
  const vehicle = data as VehicleState | null;
  if (!vehicle) return <div className="panel-placeholder">等待数据...</div>;

  return <VehicleStatus data={vehicle} />;
}

export default memo(StatusPanel);
