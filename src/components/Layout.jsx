import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export function Layout({ children, role = 'admin' }) {
  const { user, logout } = useAuth();
  const isAdmin = role === 'admin';
  const isWeighIn = role === 'weigh_in';
  const home = isAdmin ? '/admin' : isWeighIn ? '/weigh-in' : '/unit';
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand brand-hidden" aria-label="Trang chính" to={home} />
        <div className="sidebar-user"><strong>{user?.displayName}</strong><small>{user?.unitName || 'Admin hệ thống'}</small></div>
        <nav>
          {isAdmin ? <>
            <NavLink to="/admin">Dashboard</NavLink><NavLink to="/admin/users">Tài khoản</NavLink><NavLink to="/admin/areas">Sân thi đấu</NavLink><NavLink to="/admin/contents">Nội dung</NavLink><NavLink to="/admin/athletes">Thí sinh</NavLink><NavLink to="/admin/registrations">Đăng ký</NavLink><NavLink to="/admin/matches">Lượt thi / Trận</NavLink><NavLink to="/admin/sigma">Sigma - Sơ đồ</NavLink><NavLink to="/admin/weigh-ins">Kiểm tra cân</NavLink><NavLink to="/admin/results">Kết quả</NavLink><NavLink to="/admin/statistics">Thống kê toàn đoàn</NavLink><NavLink to="/admin/links">Cấp link / QR</NavLink><NavLink to="/admin/settings">Cài đặt giải</NavLink><NavLink to="/admin/account">Đổi mật khẩu</NavLink>
          </> : isWeighIn ? <><NavLink to="/weigh-in">Kiểm tra cân</NavLink><NavLink to="/weigh-in/account">Đổi mật khẩu</NavLink></> : <>
            <NavLink to="/unit">Thí sinh đơn vị</NavLink><NavLink to="/unit/registrations">Đăng ký nội dung</NavLink><NavLink to="/unit/sigma">Sigma - Sơ đồ</NavLink><NavLink to="/unit/statistics">Thống kê giải</NavLink><NavLink to="/unit/account">Đổi mật khẩu</NavLink>
          </>}
          <button className="sidebar-logout" onClick={logout}>Đăng xuất</button>
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
