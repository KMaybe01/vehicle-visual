import type { ComponentType } from 'react';
import type { TopicValue } from '../topics';

export interface PanelConfig {
  id: string;
  type: string;
  title: string;
  topic: string;
  settings: Record<string, unknown>;
}

export interface PanelComponentProps {
  config: PanelConfig;
  data: TopicValue;
  onSettingsChange: (settings: Record<string, unknown>) => void;
}

export interface PanelDefinition {
  type: string;
  label: string;
  icon: string;
  defaultTitle: string;
  defaultTopic: string;
  defaultSettings: Record<string, unknown>;
  component: ComponentType<PanelComponentProps>;
  settingsComponent?: ComponentType<{
    config: PanelConfig;
    onChange: (settings: Record<string, unknown>) => void;
  }>;
}

export interface PanelLayout {
  panels: PanelConfig[];
}

export const DEFAULT_LAYOUT: PanelLayout = {
  panels: [
    {
      id: 'panel-gauges',
      type: 'gauges',
      title: '仪表盘',
      topic: '/vehicle/state',
      settings: { metrics: ['speed', 'rpm', 'coolantTemp', 'batteryVoltage'] },
    },
    {
      id: 'panel-speed-trend',
      type: 'trend',
      title: '车速趋势',
      topic: '/vehicle/history',
      settings: { dataKey: 'speed', color: '#3b82f6', unit: 'km/h', label: '车速' },
    },
    {
      id: 'panel-rpm-trend',
      type: 'trend',
      title: '发动机转速趋势',
      topic: '/vehicle/history',
      settings: { dataKey: 'rpm', color: '#22c55e', unit: 'r/min', label: '转速' },
    },
    {
      id: 'panel-status',
      type: 'status',
      title: '车辆状态',
      topic: '/vehicle/state',
      settings: {},
    },
    {
      id: 'panel-data-table',
      type: 'data-table',
      title: '数据明细',
      topic: '/vehicle/history',
      settings: { maxRows: 50 },
    },
    {
      id: 'panel-json',
      type: 'json-viewer',
      title: '原始数据',
      topic: '/vehicle/state',
      settings: { expanded: false },
    },
  ],
};
