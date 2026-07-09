import { memo, useCallback, useState } from 'react';
import SettingsDialog from '../components/SettingsDialog/SettingsDialog';
import { getPanelDef } from './registry';
import type { PanelConfig } from './types';

interface PanelFrameProps {
  config: PanelConfig;
  children: React.ReactNode;
  onRemove?: (id: string) => void;
  onConfigChange?: (id: string, config: PanelConfig) => void;
}

function PanelFrame({ config, children, onRemove, onConfigChange }: PanelFrameProps) {
  const def = getPanelDef(config.type);
  const [showSettings, setShowSettings] = useState(false);

  const handleRemove = useCallback(() => onRemove?.(config.id), [config.id, onRemove]);
  const handleSettingsChange = useCallback(
    (settings: Record<string, unknown>) => {
      onConfigChange?.(config.id, { ...config, settings });
    },
    [config, onConfigChange],
  );

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <span className="panel-icon">{def?.icon}</span>
          <span className="panel-title">{config.title}</span>
          <span className="panel-topic-badge">{config.topic}</span>
        </div>
        <div className="panel-toolbar">
          <button
            type="button"
            className="panel-btn"
            title="设置"
            onClick={() => setShowSettings(true)}
          >
            ⚙
          </button>
          <button type="button" className="panel-btn" title="关闭" onClick={handleRemove}>
            ✕
          </button>
        </div>
      </div>
      <div className="panel-body">{children}</div>
      {showSettings && (
        <SettingsDialog
          config={config}
          def={def}
          onSave={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default memo(PanelFrame);
