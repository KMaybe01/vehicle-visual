import type { ReactNode } from 'react';

interface PanelProps {
  title: string;
  subtitle?: string;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Panel({ title, subtitle, toolbar, children, className = '' }: PanelProps) {
  return (
    <div className={`panel ${className}`}>
      <div className="panel-header">
        <div className="panel-title-group">
          <span className="panel-title">{title}</span>
          {subtitle && <span className="panel-subtitle">{subtitle}</span>}
        </div>
        {toolbar && <div className="panel-toolbar">{toolbar}</div>}
      </div>
      <div className="panel-body">{children}</div>
    </div>
  );
}
