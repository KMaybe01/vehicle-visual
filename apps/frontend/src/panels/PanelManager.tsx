import { memo, useCallback, useState } from 'react';
import { useTopic } from '../topics';
import PanelFrame from './PanelFrame';
import { PRESETS } from './presets';
import { getAllPanelDefs, getPanelDef } from './registry';
import type { PanelConfig, PanelLayout } from './types';

interface PanelItemProps {
  config: PanelConfig;
  onRemove: (id: string) => void;
  onConfigChange: (id: string, config: PanelConfig) => void;
}

function PanelItem({ config, onRemove, onConfigChange }: PanelItemProps) {
  const def = getPanelDef(config.type);
  const data = useTopic(config.topic);

  if (!def) return null;

  return (
    <PanelFrame config={config} onRemove={onRemove} onConfigChange={onConfigChange}>
      <def.component
        config={config}
        data={data}
        onSettingsChange={(s) => onConfigChange(config.id, { ...config, settings: s })}
      />
    </PanelFrame>
  );
}

const MemoPanelItem = memo(PanelItem);

interface PanelManagerProps {
  initialLayout?: PanelLayout;
}

function PanelManager({ initialLayout }: PanelManagerProps) {
  const [layout, setLayout] = useState<PanelLayout>(
    () => initialLayout ?? PRESETS.monitoring.layout,
  );
  const [showAdd, setShowAdd] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const handleRemove = useCallback((id: string) => {
    setLayout((prev) => ({
      panels: prev.panels.filter((p) => p.id !== id),
    }));
  }, []);

  const handleConfigChange = useCallback((id: string, updated: PanelConfig) => {
    setLayout((prev) => ({
      panels: prev.panels.map((p) => (p.id === id ? updated : p)),
    }));
  }, []);

  const handleAdd = useCallback((type: string) => {
    const def = getPanelDef(type);
    if (!def) return;
    const newPanel: PanelConfig = {
      id: `panel-${Date.now()}`,
      type: def.type,
      title: def.defaultTitle,
      topic: def.defaultTopic,
      settings: { ...def.defaultSettings },
    };
    setLayout((prev) => ({ panels: [...prev.panels, newPanel] }));
    setShowAdd(false);
  }, []);

  const applyPreset = useCallback((key: string) => {
    const preset = PRESETS[key];
    if (preset) {
      setLayout({
        panels: preset.layout.panels.map((p) => ({ ...p, id: `${p.id}-${Date.now()}` })),
      });
      setShowPresets(false);
    }
  }, []);

  return (
    <div className="panel-manager">
      <div className="panel-manager-toolbar">
        <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(true)}>
          + 添加面板
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setShowPresets(true)}>
          📐 布局预设
        </button>
      </div>

      <div className="panel-grid">
        {layout.panels.map((panelConfig) => (
          <MemoPanelItem
            key={panelConfig.id}
            config={panelConfig}
            onRemove={handleRemove}
            onConfigChange={handleConfigChange}
          />
        ))}
        {layout.panels.length === 0 && (
          <div className="panel-empty">
            <p>暂无面板，点击"添加面板"开始搭建</p>
          </div>
        )}
      </div>

      {showAdd && (
        <div
          className="settings-overlay"
          onClick={() => setShowAdd(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowAdd(false);
          }}
          role="presentation"
        >
          <div
            className="add-panel-dialog"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="settings-header">
              <span>添加面板</span>
              <button type="button" className="panel-btn" onClick={() => setShowAdd(false)}>
                ✕
              </button>
            </div>
            <div className="add-panel-grid">
              {getAllPanelDefs().map((def) => (
                <button
                  key={def.type}
                  type="button"
                  className="add-panel-card"
                  onClick={() => handleAdd(def.type)}
                >
                  <span className="add-panel-icon">{def.icon}</span>
                  <span className="add-panel-label">{def.label}</span>
                  <span className="add-panel-desc">话题: {def.defaultTopic}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showPresets && (
        <div
          className="settings-overlay"
          onClick={() => setShowPresets(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowPresets(false);
          }}
          role="presentation"
        >
          <div
            className="add-panel-dialog"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="settings-header">
              <span>布局预设</span>
              <button type="button" className="panel-btn" onClick={() => setShowPresets(false)}>
                ✕
              </button>
            </div>
            <div className="add-panel-grid">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  className="add-panel-card"
                  onClick={() => applyPreset(key)}
                >
                  <span className="add-panel-label">{preset.label}</span>
                  <span className="add-panel-desc">{preset.layout.panels.length} 个面板</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(PanelManager);
