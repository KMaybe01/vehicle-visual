import PanelManager from '../../panels/PanelManager';
import './VisualBuilder.css';

export default function VisualBuilder() {
  return (
    <div className="visual-builder">
      <div className="page-header">
        <h1>可视化搭建平台</h1>
        <p>低代码 Panel 搭建 · 运行时添加/删除/配置面板 · 预设布局一键切换</p>
      </div>
      <PanelManager />
    </div>
  );
}
