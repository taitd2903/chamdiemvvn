import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Card, PageHeader, StatusBadge } from '../components/Layout.jsx';
import { useGlobalState } from '../components/hooks.js';
import { statusLabel, typeLabel } from '../components/format.js';

export default function AdminAreas() {
  const { state, error, reload, setError } = useGlobalState();
  const [form, setForm] = useState({ name: '', type: 'form', judgeCount: 5 });

  async function createArea(event) {
    event.preventDefault();
    try {
      await api.createArea(form);
      setForm({ name: '', type: 'form', judgeCount: 5 });
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function changeType(area, type) {
    try {
      await api.changeAreaType(area.id, { type, judgeCount: area.judgeCount || 5 });
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(area) {
    if (!confirm(`Xóa ${area.name}?`)) return;
    try {
      await api.deleteArea(area.id);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <PageHeader title="Quản lý sân" subtitle="Admin tạo bao nhiêu sân cũng được, không code cứng số sân." actions={<Link className="btn btn-primary" to="/admin/links">Cấp link / QR</Link>} />
      {error ? <div className="alert">{error}</div> : null}
      <Card>
        <h2>Tạo sân</h2>
        <form className="inline-form" onSubmit={createArea}>
          <input placeholder="Tên sân" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, judgeCount: e.target.value === 'form' ? 5 : form.judgeCount })}>
            <option value="form">Quyền</option>
            <option value="fighting">Đối kháng</option>
          </select>
          {form.type === 'fighting' ? (
            <select value={form.judgeCount} onChange={(e) => setForm({ ...form, judgeCount: Number(e.target.value) })}>
              <option value={5}>5 giám định</option>
              <option value={4}>4 giám định</option>
            </select>
          ) : null}
          <button className="btn btn-primary">Tạo sân</button>
        </form>
      </Card>
      <Card>
        <h2>Danh sách sân</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Tên</th><th>Loại</th><th>Trạng thái</th><th>Giám định</th><th>URL</th><th>Hành động</th></tr></thead>
            <tbody>
              {(state?.areas || []).map((area) => (
                <tr key={area.id}>
                  <td>{area.name}<br /><small>ID: {area.id}</small></td>
                  <td>{typeLabel(area.type)}</td>
                  <td><StatusBadge>{statusLabel(area.status)}</StatusBadge></td>
                  <td>{area.judgeCount} giám định + 1 tổng trọng tài riêng</td>
                  <td>
                    {area.type === 'fighting' ? (
                      <div className="url-list">
                        <span>Tổng trọng tài</span><code>/fighting/area/{area.id}/referee</code>
                        <span>Màn tổng điểm</span><code>/fighting/area/{area.id}/screen</code>
                      </div>
                    ) : (
                      <div className="url-list">
                        <span>Tổng trọng tài Quyền</span><code>/forms/area/{area.id}/referee</code>
                        <span>Màn hình Quyền</span><code>/forms/area/{area.id}/screen</code>
                      </div>
                    )}
                  </td>
                  <td className="row-actions">
                    <button className="btn" onClick={() => changeType(area, area.type === 'form' ? 'fighting' : 'form')}>Đổi sang {area.type === 'form' ? 'Đối kháng' : 'Quyền'}</button>
                    <button className="btn btn-danger" onClick={() => remove(area)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
