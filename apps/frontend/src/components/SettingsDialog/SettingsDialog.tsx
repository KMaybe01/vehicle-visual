import { memo, useCallback, useState } from 'react';
import type { PanelConfig, PanelDefinition } from '../../panels/types';
import { TOPIC } from '../../topics';

interface SettingsDialogProps {
  config: PanelConfig;
  def?: PanelDefinition;
  onSave: (settings: Record<string, unknown>) => void;
  onClose: () => void;
}

const TOPIC_OPTIONS = [
  { value: TOPIC.VEHICLE_STATE, label: '/vehicle/state' },
  { value: TOPIC.VEHICLE_HISTORY, label: '/vehicle/history' },
  { value: TOPIC.VEHICLE_FAULTS, label: '/vehicle/faults' },
];

function SettingsDialog({ config, def, onSave, onClose }: SettingsDialogProps) {
  const [title, setTitle] = useState(config.title);
  const [topic, setTopic] = useState(config.topic);

  const handleSave = useCallback(() => {
    onSave({ ...config.settings });
    onClose();
  }, [config.settings, onSave, onClose]);

  return (
    <div
      className="settings-overlay"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      role="presentation"
    >
      <div
        className="settings-dialog"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="settings-header">
          <span>
            {def?.icon} {def?.label} - 设置
          </span>
          <button type="button" className="panel-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="settings-body">
          <label className="settings-field">
            <span>面板标题</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="settings-field">
            <span>数据话题</span>
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              {TOPIC_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <div className="settings-info">
            话题映射: <code>{config.topic}</code> → 面板类型 <code>{config.type}</code>
          </div>
        </div>
        <div className="settings-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            取消
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            应用
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(SettingsDialog);
