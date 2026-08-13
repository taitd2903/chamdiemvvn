import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Card, PageHeader, StatusBadge } from '../components/Layout.jsx';
import { useGlobalState } from '../components/hooks.js';
import { statusLabel, typeLabel } from '../components/format.js';

export default function AdminAreas() {
  const { state, error, reload, setError } = useGlobalState();
  const blankForm = { name: '', type: 'form', judgeCount: 5, maxRounds: 3, roundSeconds: 120, breakSeconds: 45 };
  const [form, setForm] = useState(blankForm);

  async function createArea(event) {
    event.preventDefault();
    try {
      await api.createArea(form);
      setForm(blankForm);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function changeType(area, type) {
    try {
      await api.changeAreaType(area.id, {
        type,
        judgeCount: area.judgeCount || 5,
        maxRounds: area.maxRounds || 3,
        roundSeconds: area.roundSeconds || 120,
        breakSeconds: area.breakSeconds ?? 45
      });
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function configureFightArea(area) {
    const maxRounds = window.prompt('Số hiệp mặc định', String(area.maxRounds || 3));
    if (maxRounds === null) return;
    const roundSeconds = window.prompt('Thời gian mỗi hiệp (giây)', String(area.roundSeconds || 120));
    if (roundSeconds === null) return;
    const breakSeconds = window.prompt('Thời gian nghỉ giữa hiệp (giây)', String(area.breakSeconds ?? 45));
    if (breakSeconds === null) return;
    try {
      await api.updateArea(area.id, {
        maxRounds: Number(maxRounds),
        roundSeconds: Number(roundSeconds),
        breakSeconds: Number(breakSeconds)
      });
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
      <PageHeader title="Thiết lập sân cho giải" subtitle="Chọn sân Quyền hoặc Đối kháng ngay từ đầu. Mỗi trận Đối kháng sẽ tự lấy thời gian và số hiệp từ sân." actions={<Link className="btn btn-primary" to="/admin/links">Cấp link / QR</Link>} />
      {error ? <div className="alert">{error}</div> : null}
      <Card>
        <h2>Tạo và cấu hình sân</h2>
        <form className="stack-form" onSubmit={createArea}>
          <div className="form-grid-3">
          <input placeholder="Tên sân" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, judgeCount: e.target.value === 'form' ? 5 : form.judgeCount })}>
            <option value="form">Quyền</option>
            <option value="fighting">Đối kháng</option>
          </select>
          {form.type === 'fighting' ? (
            <select value={form.judgeCount} onChange={(e) => setForm({ ...form, judgeCount: Number(e.target.value) })}>
              <option value={5}>5 giám định</option>
              <option value={3}>3 giám định</option>
            </select>
          ) : null}
          </div>
          {form.type === 'fighting' ? (
            <div className="form-grid-3">
              <label className="field-label"><span>Số hiệp mặc định</span><input type="number" min="1" value={form.maxRounds} onChange={(e) => setForm({ ...form, maxRounds: Number(e.target.value) })} /></label>
              <label className="field-label"><span>Thời gian mỗi hiệp (giây)</span><input type="number" min="1" value={form.roundSeconds} onChange={(e) => setForm({ ...form, roundSeconds: Number(e.target.value) })} /></label>
              <label className="field-label"><span>Thời gian nghỉ (giây)</span><input type="number" min="0" value={form.breakSeconds} onChange={(e) => setForm({ ...form, breakSeconds: Number(e.target.value) })} /></label>
            </div>
          ) : <p className="muted">Sân Quyền sử dụng cố định 5 giám định.</p>}
          <button className="btn btn-primary">Tạo sân</button>
        </form>
      </Card>
      <Card>
        <h2>Danh sách sân</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Tên</th><th>Loại</th><th>Trạng thái</th><th>Cấu hình</th><th>URL</th><th>Hành động</th></tr></thead>
            <tbody>
              {(state?.areas || []).map((area) => (
                <tr key={area.id}>
                  <td>{area.name}<br /><small>ID: {area.id}</small></td>
                  <td>{typeLabel(area.type)}</td>
                  <td><StatusBadge>{statusLabel(area.status)}</StatusBadge></td>
                  <td>{area.judgeCount} giám định + 1 tổng trọng tài riêng{area.type === 'fighting' ? <div className="muted">{area.maxRounds || 3} hiệp · {area.roundSeconds || 120}s/hiệp · nghỉ {area.breakSeconds ?? 45}s</div> : null}</td>
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
                    {area.type === 'fighting' ? <button className="btn" onClick={() => configureFightArea(area)}>Cấu hình thời gian</button> : null}
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
