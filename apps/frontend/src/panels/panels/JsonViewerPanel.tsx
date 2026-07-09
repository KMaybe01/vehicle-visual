import { memo, useCallback, useState } from 'react';
import type { TopicValue } from '../../topics';
import type { PanelComponentProps } from '../types';

function JsonNode({ value, depth = 0 }: { value: unknown; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const toggle = useCallback(() => setExpanded((v) => !v), []);
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') toggle();
    },
    [toggle],
  );

  if (value === null) return <span className="json-null">null</span>;
  if (typeof value === 'boolean') return <span className="json-boolean">{String(value)}</span>;
  if (typeof value === 'number') return <span className="json-number">{value}</span>;
  if (typeof value === 'string') return <span className="json-string">"{value}"</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="json-bracket">[]</span>;
    const id = `arr-${depth}`;
    return (
      <span>
        <span
          className="json-bracket"
          onClick={toggle}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
        >
          {expanded ? '▼' : '▶'} [{value.length}]
        </span>
        {expanded && (
          <div style={{ paddingLeft: 16 }}>
            {value.map((item, i) => (
              <div key={`${id}-${i}`}>
                <span className="json-index">{i}: </span>
                <JsonNode value={item} depth={depth + 1} />
                {i < value.length - 1 && <span className="json-comma">,</span>}
              </div>
            ))}
          </div>
        )}
        {expanded && <span className="json-bracket">]</span>}
      </span>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span className="json-bracket">{'{}'}</span>;
    return (
      <span>
        <span
          className="json-bracket"
          onClick={toggle}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
        >
          {expanded ? '▼' : '▶'} {'{}'}
        </span>
        {expanded && (
          <div style={{ paddingLeft: 16 }}>
            {entries.map(([key, val]) => (
              <div key={key}>
                <span className="json-key">"{key}"</span>
                <span className="json-colon">: </span>
                <JsonNode value={val} depth={depth + 1} />
                <span className="json-comma">,</span>
              </div>
            ))}
          </div>
        )}
        {expanded && <span className="json-bracket">{'}'}</span>}
      </span>
    );
  }

  return <span>{String(value)}</span>;
}

function JsonViewerPanel({ config, data }: PanelComponentProps) {
  if (data === null) return <div className="panel-placeholder">等待数据...</div>;

  return (
    <div className="json-viewer-panel">
      <JsonNode value={data} depth={0} />
    </div>
  );
}

export default memo(JsonViewerPanel);
