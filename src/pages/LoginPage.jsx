import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

function homeFor(user) { return user.role === 'admin' ? '/admin' : user.role === 'weigh_in' ? '/weigh-in' : '/unit'; }

export default function LoginPage({ weighIn = false }) {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  if (user) return <Navigate to={homeFor(user)} replace />;

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const loggedIn = await login(form.username, form.password);
      if (weighIn && loggedIn.role !== 'weigh_in') {
        await logout();
        throw new Error('Trang này chỉ dành cho tài khoản kiểm tra cân');
      }
      navigate(homeFor(loggedIn), { replace: true });
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="center-page">
      <div className="login-card">
        <h1>{weighIn ? 'Đăng nhập kiểm tra cân' : 'Đăng nhập hệ thống'}</h1>
        <p>{weighIn ? 'Dành cho tài khoản nhân viên kiểm tra cân.' : 'Dành cho Admin và Chủ đơn vị.'}</p>
        {error ? <div className="alert">{error}</div> : null}
        <form className="stack-form" onSubmit={submit}>
          <input autoComplete="username" placeholder="Tên đăng nhập" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input type="password" autoComplete="current-password" placeholder="Mật khẩu" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button className="btn btn-primary">Đăng nhập</button>
        </form>
        <Link className="btn" to="/judge">Vào màn Giám định</Link>
        <Link className="btn" to="/public">Xem giải không cần đăng nhập</Link>
      </div>
    </div>
  );
}
