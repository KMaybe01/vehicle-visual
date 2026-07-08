import ReactEChartsCore from 'echarts-for-react/esm/core';
import { BarChart, PieChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FaultRecord, RecordFile } from '../../types';
import './LogManage.css';

echarts.use([BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

interface FaultStats {
  total: number;
  active: number;
  severe: number;
  moderate: number;
  minor: number;
  byCode: Record<string, number>;
}

interface TimelineEvent {
  time: number;
  code: number;
  action: 'set' | 'clear';
}

const LEVEL_LABEL: Record<string, string> = { minor: '轻微', moderate: '一般', severe: '严重' };
const LEVEL_COLOR: Record<string, string> = {
  minor: '#22c55e',
  moderate: '#eab308',
  severe: '#ef4444',
};

function FaultStatsView() {
  const [stats, setStats] = useState<FaultStats | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  const fetchStats = useCallback(async () => {
    try {
      const [sr, tr] = await Promise.all([
        fetch('/api/faults/stats').then((r) => r.json()),
        fetch('/api/faults/timeline').then((r) => r.json()),
      ]);
      setStats(sr);
      setTimeline(tr);
    } catch {}
  }, []);

  useEffect(() => {
    fetchStats();
    const i = setInterval(fetchStats, 3000);
    return () => clearInterval(i);
  }, [fetchStats]);

  const pieOption = useMemo(
    () => ({
      tooltip: { trigger: 'item' as const },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: 'var(--bg-card)', borderWidth: 2 },
          label: {
            show: true,
            formatter: '{b}: {c}',
            color: 'var(--text-secondary)',
            fontSize: 12,
          },
          data: [
            { value: stats?.severe ?? 0, name: '严重', itemStyle: { color: LEVEL_COLOR.severe } },
            {
              value: stats?.moderate ?? 0,
              name: '一般',
              itemStyle: { color: LEVEL_COLOR.moderate },
            },
            { value: stats?.minor ?? 0, name: '轻微', itemStyle: { color: LEVEL_COLOR.minor } },
          ].filter((d) => d.value > 0),
        },
      ],
    }),
    [stats],
  );

  const barOption = useMemo(() => {
    const codes = stats
      ? Object.entries(stats.byCode).sort((a, b) => Number(b[0]) - Number(a[0]))
      : [];
    return {
      tooltip: { trigger: 'axis' as const },
      grid: { left: 70, right: 20, top: 10, bottom: 30 },
      xAxis: {
        type: 'category' as const,
        data: codes.map(([c]) => `P${c.padStart(4, '0')}`),
        axisLabel: { color: 'var(--text-secondary)', fontSize: 11 },
      },
      yAxis: {
        type: 'value' as const,
        minInterval: 1,
        axisLabel: { color: 'var(--text-muted)' },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      },
      series: [
        {
          type: 'bar',
          data: codes.map(([, v]) => v),
          itemStyle: { borderRadius: [4, 4, 0, 0], color: '#3b82f6' },
          barMaxWidth: 32,
        },
      ],
    };
  }, [stats]);

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString('zh-CN');

  const codeName = (code: number) => {
    const map: Record<number, string> = {
      101: 'MAF传感器',
      102: '进气温度',
      300: '随机失火',
      301: '1缸失火',
      420: '催化器',
      501: '车速传感器',
      502: '怠速控制',
      601: '电池电压',
      701: '变速箱油温',
    };
    return map[code] || `P${code}`;
  };

  return (
    <div className="stats-view">
      <div className="stats-cards">
        <div className="stat-card">
          <span className="stat-value">{stats?.total ?? '-'}</span>
          <span className="stat-label">总故障</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: LEVEL_COLOR.severe }}>
            {stats?.active ?? '-'}
          </span>
          <span className="stat-label">当前活动</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: LEVEL_COLOR.severe }}>
            {stats?.severe ?? '-'}
          </span>
          <span className="stat-label">严重</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: LEVEL_COLOR.moderate }}>
            {stats?.moderate ?? '-'}
          </span>
          <span className="stat-label">一般</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: LEVEL_COLOR.minor }}>
            {stats?.minor ?? '-'}
          </span>
          <span className="stat-label">轻微</span>
        </div>
      </div>

      <div className="stats-charts">
        <div className="stats-chart-card">
          <div className="stats-chart-title">严重程度分布</div>
          <ReactEChartsCore echarts={echarts} option={pieOption} style={{ height: 260 }} notMerge />
        </div>
        <div className="stats-chart-card">
          <div className="stats-chart-title">故障码频次</div>
          <ReactEChartsCore echarts={echarts} option={barOption} style={{ height: 260 }} notMerge />
        </div>
      </div>

      <div className="stats-chart-card">
        <div className="stats-chart-title">最近故障事件</div>
        {timeline.length === 0 ? (
          <div className="empty-state">
            <p>暂无故障事件</p>
          </div>
        ) : (
          <div className="timeline-list">
            {timeline
              .slice(-30)
              .reverse()
              .map((e, i) => (
                <div key={`${e.time}-${e.code}-${i}`} className={`timeline-item ${e.action}`}>
                  <span className={`timeline-dot ${e.action}`} />
                  <span className="timeline-time">{formatTime(e.time)}</span>
                  <span className="timeline-code">P{e.code.toString().padStart(4, '0')}</span>
                  <span className="timeline-name">{codeName(e.code)}</span>
                  <span className={`timeline-action ${e.action}`}>
                    {e.action === 'set' ? '触发' : '清除'}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FaultListView({
  faults,
  onClear,
  onClearAll,
}: { faults: FaultRecord[]; onClear: (code: number) => void; onClearAll: () => void }) {
  return (
    <div className="section">
      <div className="section-header">
        <span className="section-title">故障码记录 ({faults.length})</span>
        <button type="button" className="btn btn-danger" onClick={onClearAll}>
          清除全部
        </button>
      </div>
      {faults.length === 0 ? (
        <div className="empty-state">
          <p>暂无故障码记录</p>
        </div>
      ) : (
        <div className="fault-list">
          {faults.map((fault, idx) => (
            <div
              key={`${fault.code}-${fault.timestamp}-${idx}`}
              className={`fault-bar${fault.cleared ? ' cleared' : ''}`}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className={`fault-${fault.level}`}
                    style={{ fontWeight: 700, fontFamily: 'monospace' }}
                  >
                    P{fault.code.toString().padStart(4, '0')}
                  </span>
                  <span
                    className={`fault-${fault.level}`}
                    style={{
                      fontSize: 11,
                      padding: '1px 6px',
                      borderRadius: 4,
                      background: 'rgba(239,68,68,0.1)',
                    }}
                  >
                    {LEVEL_LABEL[fault.level] || fault.level}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {fault.description}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {new Date(fault.timestamp).toLocaleString('zh-CN')}{' '}
                  {fault.cleared ? '(已清除)' : ''}
                </div>
              </div>
              {!fault.cleared && (
                <button type="button" className="btn btn-ghost" onClick={() => onClear(fault.code)}>
                  清除
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LogManage() {
  const [faults, setFaults] = useState<FaultRecord[]>([]);
  const [records, setRecords] = useState<RecordFile[]>([]);
  const [recording, setRecording] = useState(false);
  const [activeTab, setActiveTab] = useState<'faults' | 'records' | 'stats'>('faults');

  const fetchFaults = useCallback(async () => {
    try {
      const res = await fetch('/api/faults');
      if (res.ok) setFaults(await res.json());
    } catch {}
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch('/api/records');
      if (res.ok) setRecords(await res.json());
    } catch {}
  }, []);

  const fetchRecordingStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/records/status');
      if (res.ok) setRecording((await res.json()).recording);
    } catch {}
  }, []);

  useEffect(() => {
    fetchFaults();
    fetchRecords();
    fetchRecordingStatus();
    const i = setInterval(fetchRecordingStatus, 2000);
    return () => clearInterval(i);
  }, [fetchFaults, fetchRecords, fetchRecordingStatus]);

  const handleClearFault = async (code: number) => {
    await fetch(`/api/faults/${code}/clear`, { method: 'POST' });
    fetchFaults();
  };

  const handleClearAll = async () => {
    await fetch('/api/faults/clear-all', { method: 'DELETE' });
    fetchFaults();
  };

  const handleToggleRecording = async () => {
    if (recording) await fetch('/api/records/stop', { method: 'POST' });
    else await fetch('/api/records/start', { method: 'POST' });
    fetchRecordingStatus();
    fetchRecords();
  };

  const handleExport = (id: string) => window.open(`/api/records/${id}/export`, '_blank');
  const handleDeleteRecord = async (id: string) => {
    await fetch(`/api/records/${id}`, { method: 'DELETE' });
    fetchRecords();
  };

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}分${s % 60}秒`;
  };

  return (
    <div className="log-manage">
      <div className="page-header">
        <h1>故障日志与统计</h1>
        <p>故障码查询 / 数据录制 / 统计分析</p>
      </div>

      <div className="log-tabs">
        <button
          type="button"
          className={`tab-btn${activeTab === 'faults' ? ' active' : ''}`}
          onClick={() => setActiveTab('faults')}
        >
          故障码
        </button>
        <button
          type="button"
          className={`tab-btn${activeTab === 'stats' ? ' active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          统计
        </button>
        <button
          type="button"
          className={`tab-btn${activeTab === 'records' ? ' active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          数据录制
        </button>
      </div>

      {activeTab === 'faults' && (
        <FaultListView faults={faults} onClear={handleClearFault} onClearAll={handleClearAll} />
      )}

      {activeTab === 'stats' && <FaultStatsView />}

      {activeTab === 'records' && (
        <div className="section">
          <div className="section-header">
            <span className="section-title">数据录制</span>
            <button
              type="button"
              className={`btn ${recording ? 'btn-danger' : 'btn-primary'}`}
              onClick={handleToggleRecording}
            >
              {recording ? '停止录制' : '开始录制'}
            </button>
          </div>
          {recording && (
            <div className="recording-indicator">
              <span className="recording-dot" />
              正在录制数据...
            </div>
          )}
          {records.length === 0 ? (
            <div className="empty-state">
              <p>暂无录制记录</p>
            </div>
          ) : (
            <div className="record-list">
              {records.map((record) => (
                <div key={record.id} className="record-item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{record.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                      {new Date(record.startTime).toLocaleString('zh-CN')} ·{' '}
                      {formatDuration(record.duration)} · {record.sampleCount} 样本
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => handleExport(record.id)}
                    >
                      导出
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => handleDeleteRecord(record.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
