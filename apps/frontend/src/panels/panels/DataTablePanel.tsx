import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { VehicleState } from '../../types';
import type { PanelComponentProps } from '../types';

interface ColumnDef {
  key: keyof VehicleState | 'timestamp';
  label: string;
  format?: (v: unknown) => string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'timestamp', label: '时间', format: (v) => new Date(v as number).toLocaleTimeString() },
  { key: 'speed', label: '车速(km/h)', format: (v) => (v as number).toFixed(1) },
  { key: 'rpm', label: '转速', format: (v) => Math.round(v as number).toString() },
  { key: 'coolantTemp', label: '水温(°C)', format: (v) => (v as number).toFixed(1) },
  { key: 'batteryVoltage', label: '电压(V)', format: (v) => (v as number).toFixed(2) },
  { key: 'throttlePos', label: '油门(%)', format: (v) => (v as number).toFixed(1) },
  { key: 'gearPosition', label: '档位' },
  { key: 'fuelLevel', label: '油量(%)', format: (v) => (v as number).toFixed(1) },
];

const ROW_HEIGHT = 28;
const OVERSCAN = 5;

function DataTablePanel({ config, data }: PanelComponentProps) {
  const history = data as VehicleState[] | null;
  const maxRows = (config.settings.maxRows as number) ?? 50;
  const rows = useMemo(
    () => (history ? history.slice(-maxRows).reverse() : []),
    [history, maxRows],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerHeight(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onScroll = useCallback(() => {
    if (containerRef.current) setScrollTop(containerRef.current.scrollTop);
  }, []);

  const totalHeight = rows.length * ROW_HEIGHT;
  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIdx = Math.min(
    rows.length,
    Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN,
  );
  const visibleRows = useMemo(() => rows.slice(startIdx, endIdx), [rows, startIdx, endIdx]);

  if (!history || history.length === 0) return <div className="panel-placeholder">等待数据...</div>;

  return (
    <div className="data-table-panel">
      <div className="data-table-header">
        {COLUMNS.map((col) => (
          <div key={col.key} className="data-table-cell header">
            {col.label}
          </div>
        ))}
      </div>
      <div ref={containerRef} className="data-table-body" onScroll={onScroll}>
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ position: 'absolute', top: startIdx * ROW_HEIGHT, left: 0, right: 0 }}>
            {visibleRows.map((row, i) => (
              <div
                key={`row-${startIdx + i}`}
                className="data-table-row"
                style={{ height: ROW_HEIGHT }}
              >
                {COLUMNS.map((col) => (
                  <div key={col.key} className="data-table-cell">
                    {col.format
                      ? col.format(row[col.key as keyof VehicleState])
                      : String(row[col.key as keyof VehicleState] ?? '')}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(DataTablePanel);
