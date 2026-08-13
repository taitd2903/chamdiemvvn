import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Card, PageHeader, StatusBadge } from '../components/Layout.jsx';

const blank = { username: '', password: '', displayName: '', unitName: '', role: 'unit_owner' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');
  const load = () => api.getUsers().then(setUsers).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    try { await api.createUser(form); setForm(blank); load(); } catch (err) { setError(err.message); }
  }
  async function resetPassword(user) {
    const password = window.prompt(`Mật khẩu mới cho ${user.username} (ít nhất 6 ký tự):`);
    if (!password) return;
    try { await api.resetUserPassword(user.id, password); alert('Đã đổi mật khẩu và đăng xuất các phiên cũ.'); } catch (err) { setError(err.message); }
  }
  async function toggle(user) {
    try { await api.updateUserStatus(user.id, !user.active); load(); } catch (err) { setError(err.message); }
  }

  return <>
    <PageHeader title="Quản lý tài khoản" subtitle="Admin cấp tài khoản riêng cho Chủ đơn vị và nhân viên kiểm tra cân." />
    {error ? <div className="alert">{error}</div> : null}
    <Card><h2>Tạo tài khoản</h2><form className="form-grid-3" onSubmit={submit}>
      <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="unit_owner">Chủ đơn vị</option><option value="weigh_in">Nhân viên kiểm tra cân</option></select>
      <input placeholder={form.role === 'weigh_in' ? 'Tên nhân viên cân' : 'Tên chủ đơn vị'} value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
      {form.role === 'unit_owner' ? <input placeholder="Tên đơn vị / CLB" value={form.unitName} onChange={(e) => setForm({ ...form, unitName: e.target.value })} /> : null}
      <input placeholder="Tên đăng nhập" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
      <input type="password" placeholder="Mật khẩu ban đầu (≥ 6 ký tự)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <button className="btn btn-primary">Tạo tài khoản</button>
    </form></Card>
    <Card><h2>Danh sách tài khoản</h2><div className="table-wrap"><table><thead><tr><th>Người dùng</th><th>Loại tài khoản</th><th>Đơn vị</th><th>Tên đăng nhập</th><th>Trạng thái</th><th></th></tr></thead><tbody>
      {users.map((user) => <tr key={user.id}><td>{user.displayName}</td><td>{user.role === 'weigh_in' ? 'Kiểm tra cân' : 'Chủ đơn vị'}</td><td>{user.unitName || '—'}</td><td>{user.username}</td><td><StatusBadge tone={user.active ? 'success' : 'neutral'}>{user.active ? 'Đang hoạt động' : 'Đã khóa'}</StatusBadge></td><td><div className="row-actions"><button className="btn btn-small" onClick={() => resetPassword(user)}>Đặt lại mật khẩu</button><button className="btn btn-small" onClick={() => toggle(user)}>{user.active ? 'Khóa' : 'Mở khóa'}</button></div></td></tr>)}
    </tbody></table></div></Card>
  </>;
}
