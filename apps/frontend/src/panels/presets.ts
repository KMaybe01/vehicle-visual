import type { PanelLayout } from './types';

export const PRESETS: Record<string, { label: string; layout: PanelLayout }> = {
  monitoring: {
    label: '实时监控',
    layout: {
      panels: [
        {
          id: 'p-gauge',
          type: 'gauges',
          title: '仪表盘',
          topic: '/vehicle/state',
          settings: { metrics: ['speed', 'rpm', 'coolantTemp', 'batteryVoltage'] },
        },
        {
          id: 'p-speed',
          type: 'trend',
          title: '车速趋势',
          topic: '/vehicle/history',
          settings: { dataKey: 'speed', color: '#3b82f6', unit: 'km/h', label: '车速' },
        },
        {
          id: 'p-rpm',
          type: 'trend',
          title: '转速趋势',
          topic: '/vehicle/history',
          settings: { dataKey: 'rpm', color: '#22c55e', unit: 'r/min', label: '转速' },
        },
        {
          id: 'p-status',
          type: 'status',
          title: '车辆状态',
          topic: '/vehicle/state',
          settings: {},
        },
      ],
    },
  },
  debug: {
    label: '调试模式',
    layout: {
      panels: [
        {
          id: 'p-json',
          type: 'json-viewer',
          title: '原始数据',
          topic: '/vehicle/state',
          settings: { expanded: true },
        },
        {
          id: 'p-table',
          type: 'data-table',
          title: '数据明细',
          topic: '/vehicle/history',
          settings: { maxRows: 100 },
        },
        {
          id: 'p-gauge',
          type: 'gauges',
          title: '仪表盘',
          topic: '/vehicle/state',
          settings: { metrics: ['speed', 'rpm', 'coolantTemp', 'batteryVoltage'] },
        },
      ],
    },
  },
  full: {
    label: '完整布局',
    layout: {
      panels: [
        {
          id: 'p-gauge',
          type: 'gauges',
          title: '仪表盘',
          topic: '/vehicle/state',
          settings: { metrics: ['speed', 'rpm', 'coolantTemp', 'batteryVoltage'] },
        },
        {
          id: 'p-speed',
          type: 'trend',
          title: '车速趋势',
          topic: '/vehicle/history',
          settings: { dataKey: 'speed', color: '#3b82f6', unit: 'km/h', label: '车速' },
        },
        {
          id: 'p-rpm',
          type: 'trend',
          title: '转速趋势',
          topic: '/vehicle/history',
          settings: { dataKey: 'rpm', color: '#22c55e', unit: 'r/min', label: '转速' },
        },
        {
          id: 'p-status',
          type: 'status',
          title: '车辆状态',
          topic: '/vehicle/state',
          settings: {},
        },
        {
          id: 'p-table',
          type: 'data-table',
          title: '数据明细',
          topic: '/vehicle/history',
          settings: { maxRows: 50 },
        },
        {
          id: 'p-json',
          type: 'json-viewer',
          title: '原始数据',
          topic: '/vehicle/state',
          settings: { expanded: false },
        },
      ],
    },
  },
};
