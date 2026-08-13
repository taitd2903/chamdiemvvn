import { useState } from 'react';
import { api } from '../api.js';
import { Card, PageHeader } from '../components/Layout.jsx';

export default function AccountPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setError(''); setMessage('');
    if (form.newPassword !== form.confirm) return setError('Mật khẩu nhập lại không khớp');
    try { await api.changePassword(form); setForm({ currentPassword: '', newPassword: '', confirm: '' }); setMessage('Đã đổi mật khẩu.'); }
    catch (err) { setError(err.message); }
  }
  return <><PageHeader title="Đổi mật khẩu" subtitle="Đổi mật khẩu của chính tài khoản đang đăng nhập." />
    {error ? <div className="alert">{error}</div> : null}{message ? <div className="alert success">{message}</div> : null}
    <Card><form className="stack-form account-password-form" onSubmit={submit}>
      <input type="password" placeholder="Mật khẩu hiện tại" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
      <input type="password" placeholder="Mật khẩu mới (ít nhất 6 ký tự)" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
      <input type="password" placeholder="Nhập lại mật khẩu mới" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
      <button className="btn btn-primary">Đổi mật khẩu</button>
    </form></Card></>;
}
