import { NavLink, Outlet } from 'react-router-dom';
import { useVehicleData } from './hooks/useVehicleData';

const navItems = [
  { path: '/dashboard', label: '仪表盘', icon: '📊' },
  { path: '/vehicle-3d', label: '3D 孪生', icon: '🚗' },
  { path: '/logs', label: '故障日志', icon: '📋' },
];

function SocketListener() {
  useVehicleData();
  return null;
}

export default function App() {
  return (
    <div className="app-container">
      <SocketListener />
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <h2>车载可视化</h2>
          <span className="sidebar-subtitle">Vehicle HMI</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span>v0.1.0</span>
        </div>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
