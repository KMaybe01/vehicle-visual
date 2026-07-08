import React, { useCallback, useEffect, useRef, useState } from 'react';
import { emitReset, emitToggleDriving } from '../../hooks/useVehicleData';
import { useVehicleStore } from '../../store';
import type { UserControl } from '../../types';

export default function ControlPanel({
  controlRef,
  setControl,
}: {
  controlRef: React.MutableRefObject<UserControl>;
  setControl: (partial: Partial<UserControl>) => void;
}) {
  const data = useVehicleStore((s) => s.currentData);
  const ctrl = controlRef.current;
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className={`ctrl-panel${collapsed ? ' collapsed' : ''}`}>
      <button type="button" className="ctrl-toggle" onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? '◀' : '▶'}
      </button>

      {!collapsed && (
        <div className="ctrl-body">
          <div className="ctrl-header">
            <span className="ctrl-title">驾驶控制</span>
            <span className="ctrl-badge" data-mode={ctrl.manualMode ? 'manual' : 'auto'}>
              {ctrl.manualMode ? '手动' : '自动'}
            </span>
          </div>

          <div className="ctrl-buttons">
            <button
              type="button"
              className={`ctrl-btn ${ctrl.manualMode ? 'active' : ''}`}
              onClick={() => {
                setControl({ manualMode: !ctrl.manualMode });
                if (ctrl.manualMode)
                  setControl({ throttle: 0, brake: false, steeringAngle: 0, turnSignal: 'none' });
              }}
            >
              {ctrl.manualMode ? '切换自动' : '切换手动'}
            </button>
          </div>

          {ctrl.manualMode && (
            <>
              <div className="ctrl-group">
                <span className="ctrl-label">油门</span>
                <div className="ctrl-slider-row">
                  <div className="ctrl-slider-bg">
                    <div
                      className="ctrl-slider-fill"
                      style={{ width: `${ctrl.throttle}%`, background: '#22c55e' }}
                    />
                    <div className="ctrl-slider-thumb" style={{ left: `${ctrl.throttle}%` }} />
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={ctrl.throttle}
                    onChange={(e) => setControl({ throttle: Number(e.target.value) })}
                    className="ctrl-range"
                  />
                </div>
              </div>

              <div className="ctrl-group">
                <span className="ctrl-label">刹车</span>
                <button
                  type="button"
                  className={`ctrl-pedal${ctrl.brake ? ' active' : ''}`}
                  onMouseDown={() => setControl({ brake: true })}
                  onMouseUp={() => setControl({ brake: false })}
                  onMouseLeave={() => ctrl.brake && setControl({ brake: false })}
                >
                  {ctrl.brake ? '🛑 刹车中' : '刹车'}
                </button>
              </div>

              <div className="ctrl-group">
                <span className="ctrl-label">转向</span>
                <div className="ctrl-slider-row">
                  <span className="ctrl-steer-indicator">←</span>
                  <input
                    type="range"
                    min={-45}
                    max={45}
                    value={ctrl.steeringAngle}
                    onChange={(e) => setControl({ steeringAngle: Number(e.target.value) })}
                    className="ctrl-range"
                  />
                  <span className="ctrl-steer-indicator">→</span>
                </div>
                <span className="ctrl-steer-value">{ctrl.steeringAngle.toFixed(1)}°</span>
              </div>

              <div className="ctrl-group">
                <span className="ctrl-label">档位</span>
                <div className="ctrl-gears">
                  {['P', 'R', 'N', 'D'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`ctrl-gear${ctrl.gearPosition === g ? ' active' : ''}`}
                      onClick={() => setControl({ gearPosition: g })}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ctrl-group">
                <span className="ctrl-label">转向灯</span>
                <div className="ctrl-signals">
                  {(['left', 'hazard', 'right'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`ctrl-signal${ctrl.turnSignal === s ? ' active' : ''}`}
                      onClick={() => setControl({ turnSignal: ctrl.turnSignal === s ? 'none' : s })}
                    >
                      {s === 'left' ? '◄' : s === 'right' ? '►' : '▲'}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`ctrl-signal${ctrl.turnSignal === 'none' ? ' active' : ''}`}
                    onClick={() => setControl({ turnSignal: 'none' })}
                  >
                    关
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="ctrl-status">
            <div className="ctrl-status-row">
              <span>车速</span>
              <span style={{ color: '#3b82f6' }}>{(data?.speed ?? 0).toFixed(0)} km/h</span>
            </div>
            <div className="ctrl-status-row">
              <span>转速</span>
              <span style={{ color: '#22c55e' }}>{(data?.rpm ?? 0).toFixed(0)} rpm</span>
            </div>
            <div className="ctrl-status-row">
              <span>档位</span>
              <span style={{ color: '#a78bfa' }}>{data?.gearPosition ?? '-'}</span>
            </div>
            <div className="ctrl-status-row">
              <span>油门</span>
              <span style={{ color: '#22c55e' }}>{(data?.throttlePos ?? 0).toFixed(0)}%</span>
            </div>
            <div className="ctrl-status-row">
              <span>转向</span>
              <span style={{ color: '#f97316' }}>{(data?.steeringAngle ?? 0).toFixed(1)}°</span>
            </div>
          </div>

          <div className="ctrl-footer">
            <button type="button" className="ctrl-btn small" onClick={emitToggleDriving}>
              启停
            </button>
            <button type="button" className="ctrl-btn small" onClick={emitReset}>
              重置
            </button>
          </div>

          <div className="ctrl-hint">键盘: WASD/方向 驾驶 · M切换模式 · Q/E转向灯 · 空格双闪</div>
        </div>
      )}
    </div>
  );
}
