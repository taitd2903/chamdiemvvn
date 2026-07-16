import { Link, NavLink } from 'react-router-dom';

export function Layout({ children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/admin">Vovinam</Link>
        <nav>
          <NavLink to="/admin">Dashboard</NavLink>
          <NavLink to="/admin/areas">Sân thi đấu</NavLink>
          <NavLink to="/admin/contents">Nội dung</NavLink>
          <NavLink to="/admin/athletes">Thí sinh</NavLink>
          <NavLink to="/admin/registrations">Đăng ký</NavLink>
          <NavLink to="/admin/matches">Lượt thi / Trận</NavLink>
          <NavLink to="/admin/results">Kết quả</NavLink>
          <NavLink to="/admin/links">Cấp link / QR</NavLink>
          <NavLink to="/admin/settings">Cài đặt giải</NavLink>
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="header-actions">{actions}</div> : null}
    </div>
  );
}

export function StatusBadge({ children, tone = 'neutral' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Card({ children, className = '' }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function Empty({ children = 'Chưa có dữ liệu' }) {
  return <div className="empty">{children}</div>;
}
