import { memo, useEffect, useRef, useState } from 'react';
import PlaybackBar from '../../components/PlaybackBar/PlaybackBar';
import { useDataWorker } from '../../hooks/useDataWorker';
import { emitReset, emitToggleDriving } from '../../hooks/useVehicleData';
import { useVehicleStore } from '../../store';
import { TOPIC, useTopic } from '../../topics';
import type { VehicleState } from '../../types';
import GaugeChart from './GaugeChart';
import TrendChart from './TrendChart';
import VehicleStatus from './VehicleStatus';
import './Dashboard2D.css';

function StatsBar() {
  const history = useVehicleStore((s) => s.historyData);
  const stats = useDataWorker(history);

  if (!stats || history.length < 2) return null;

  return (
    <div className="stats-bar">
      <span>样本: {stats.sampleCount}</span>
      <span>时长: {(stats.durationMs / 1000).toFixed(0)}s</span>
      <span>平均车速: {stats.avgSpeed.toFixed(1)} km/h</span>
      <span>最高车速: {stats.maxSpeed.toFixed(1)} km/h</span>
      <span>平均转速: {stats.avgRpm.toFixed(0)} r/min</span>
    </div>
  );
}

const MemoStatsBar = memo(StatsBar);

function useThrottledValue<T>(value: T, intervalMs: number): T {
  const [throttled, setThrottled] = useState(value);
  const lastUpdate = useRef(0);

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdate.current >= intervalMs) {
      lastUpdate.current = now;
      setThrottled(value);
    } else {
      const timer = setTimeout(
        () => {
          lastUpdate.current = Date.now();
          setThrottled(value);
        },
        intervalMs - (now - lastUpdate.current),
      );
      return () => clearTimeout(timer);
    }
  }, [value, intervalMs]);

  return throttled;
}

function Dashboard2D() {
  const data = useVehicleStore((s) => s.currentData);
  const history = useVehicleStore((s) => s.historyData);
  const playbackData = useTopic<VehicleState>(TOPIC.VEHICLE_STATE);

  const chartHistory: VehicleState[] = useThrottledValue(history, 500);
  const displayData = playbackData ?? data;

  if (!displayData) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>正在连接车载数据...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-2d">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>车载仪表盘</h1>
            <p>实时车况数据监控</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={emitToggleDriving}>
              切换驾驶
            </button>
            <button type="button" className="btn btn-ghost" onClick={emitReset}>
              重置
            </button>
          </div>
        </div>
      </div>

      <PlaybackBar />
      <MemoStatsBar />

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <div className="gauges-row">
            <GaugeChart
              label="车速"
              value={displayData.speed}
              unit="km/h"
              min={0}
              max={180}
              color="#3b82f6"
            />
            <GaugeChart
              label="发动机转速"
              value={displayData.rpm}
              unit="r/min"
              min={0}
              max={8000}
              color="#22c55e"
            />
            <GaugeChart
              label="冷却液温度"
              value={displayData.coolantTemp}
              unit="°C"
              min={0}
              max={120}
              color={displayData.coolantTemp > 95 ? '#ef4444' : '#eab308'}
            />
            <GaugeChart
              label="电池电压"
              value={displayData.batteryVoltage}
              unit="V"
              min={8}
              max={16}
              color="#06b6d4"
            />
          </div>
          <div className="charts-row">
            <div className="card" style={{ flex: 1 }}>
              <div className="card-title">车速趋势 (最近60秒)</div>
              <TrendChart data={chartHistory} dataKey="speed" color="#3b82f6" unit="km/h" />
            </div>
            <div className="card" style={{ flex: 1 }}>
              <div className="card-title">发动机转速趋势 (最近60秒)</div>
              <TrendChart data={chartHistory} dataKey="rpm" color="#22c55e" unit="r/min" />
            </div>
          </div>
        </div>
        <aside className="dashboard-sidebar">
          <VehicleStatus data={displayData} />
        </aside>
      </div>
    </div>
  );
}

export default memo(Dashboard2D);
