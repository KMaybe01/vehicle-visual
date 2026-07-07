import { useCallback, useEffect, useState } from 'react';
import { socket } from '../../socket';
import type { FaultRecord, RecordFile } from '../../types';
import './LogManage.css';

export default function LogManage() {
  const [faults, setFaults] = useState<FaultRecord[]>([]);
  const [records, setRecords] = useState<RecordFile[]>([]);
  const [recording, setRecording] = useState(false);
  const [activeTab, setActiveTab] = useState<'faults' | 'records'>('faults');

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
      if (res.ok) {
        const data = await res.json();
        setRecording(data.recording);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchFaults();
    fetchRecords();
    fetchRecordingStatus();

    const interval = setInterval(() => {
      fetchRecordingStatus();
    }, 2000);

    return () => clearInterval(interval);
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
    if (recording) {
      await fetch('/api/records/stop', { method: 'POST' });
    } else {
      await fetch('/api/records/start', { method: 'POST' });
    }
    fetchRecordingStatus();
    fetchRecords();
  };

  const handleExport = (id: string) => {
    window.open(`/api/records/${id}/export`, '_blank');
  };

  const handleDeleteRecord = async (id: string) => {
    await fetch(`/api/records/${id}`, { method: 'DELETE' });
    fetchRecords();
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleString('zh-CN');
  };

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}分${s % 60}秒`;
  };

  const levelLabel = (level: string) => {
    const map: Record<string, string> = { minor: '轻微', moderate: '一般', severe: '严重' };
    return map[level] || level;
  };

  return (
    <div className="log-manage">
      <div className="page-header">
        <h1>故障日志</h1>
        <p>故障码查询 / 数据录制 / 日志导出</p>
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
          className={`tab-btn${activeTab === 'records' ? ' active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          数据录制
        </button>
      </div>

      {activeTab === 'faults' && (
        <div className="section">
          <div className="section-header">
            <span className="section-title">故障码记录 ({faults.length})</span>
            <button type="button" className="btn btn-danger" onClick={handleClearAll}>
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
                        {levelLabel(fault.level)}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {fault.description}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {formatTime(fault.timestamp)} {fault.cleared ? '(已清除)' : ''}
                    </div>
                  </div>
                  {!fault.cleared && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => handleClearFault(fault.code)}
                    >
                      清除
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                      {formatTime(record.startTime)} · {formatDuration(record.duration)} ·{' '}
                      {record.sampleCount} 样本
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
