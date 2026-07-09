import DataTablePanel from './panels/DataTablePanel';
import GaugePanel from './panels/GaugePanel';
import JsonViewerPanel from './panels/JsonViewerPanel';
import StatusPanel from './panels/StatusPanel';
import TrendPanel from './panels/TrendPanel';
import type { PanelDefinition } from './types';

const registry = new Map<string, PanelDefinition>();

export function registerPanel(def: PanelDefinition) {
  registry.set(def.type, def);
}

export function getPanelDef(type: string): PanelDefinition | undefined {
  return registry.get(type);
}

export function getAllPanelDefs(): PanelDefinition[] {
  return Array.from(registry.values());
}

registerPanel({
  type: 'gauges',
  label: '仪表盘',
  icon: '📊',
  defaultTitle: '仪表盘',
  defaultTopic: '/vehicle/state',
  defaultSettings: { metrics: ['speed', 'rpm', 'coolantTemp', 'batteryVoltage'] },
  component: GaugePanel,
});

registerPanel({
  type: 'trend',
  label: '趋势图',
  icon: '📈',
  defaultTitle: '趋势图',
  defaultTopic: '/vehicle/history',
  defaultSettings: { dataKey: 'speed', color: '#3b82f6', unit: 'km/h', label: '数值' },
  component: TrendPanel,
});

registerPanel({
  type: 'status',
  label: '车辆状态',
  icon: '🚗',
  defaultTitle: '车辆状态',
  defaultTopic: '/vehicle/state',
  defaultSettings: {},
  component: StatusPanel,
});

registerPanel({
  type: 'data-table',
  label: '数据表格',
  icon: '📋',
  defaultTitle: '数据明细',
  defaultTopic: '/vehicle/history',
  defaultSettings: { maxRows: 50 },
  component: DataTablePanel,
});

registerPanel({
  type: 'json-viewer',
  label: 'JSON 查看器',
  icon: '📄',
  defaultTitle: '原始数据',
  defaultTopic: '/vehicle/state',
  defaultSettings: { expanded: false },
  component: JsonViewerPanel,
});
