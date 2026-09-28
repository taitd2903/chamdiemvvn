import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { Card, PageHeader, StatusBadge } from '../components/Layout.jsx';
import { useAuth } from '../auth.jsx';
import { AthletePhoto } from '../components/AthletePhoto.jsx';

function statusText(weighIn) {
  if (!weighIn || weighIn.status === 'pending') return 'Chưa cân';
  if (weighIn.status === 'passed') return 'Đủ cân';
  return weighIn.reason;
}

function WeighRow({ row, onSaved, onError, isAdmin }) {
  const [weight, setWeight] = useState(row.weighIn?.actualWeightKg ?? '');
  const [note, setNote] = useState(row.weighIn?.note || '');
  const [saving, setSaving] = useState(false);
  const locked = Boolean(row.weighIn?.lockedAt);
  async function save() {
    setSaving(true);
    try { await api.updateWeighIn(row.athlete.id, row.content.id, { actualWeightKg: weight, note }); await onSaved(); }
    catch (err) { onError(err.message); } finally { setSaving(false); }
  }
  async function lock() {
    setSaving(true);
    try { await api.lockWeighIn(row.athlete.id, row.content.id); await onSaved(); }
    catch (err) { onError(err.message); } finally { setSaving(false); }
  }
  async function unlock() {
    if (!window.confirm(`Mở chốt cân của ${row.athlete.name}?`)) return;
    setSaving(true);
    try { await api.unlockWeighIn(row.athlete.id, row.content.id); await onSaved(); }
    catch (err) { onError(err.message); } finally { setSaving(false); }
  }
  const tone = row.weighIn?.status === 'passed' ? 'success' : ['under', 'over'].includes(row.weighIn?.status) ? 'danger' : 'neutral';
  return <tr>
    <td><AthletePhoto athlete={row.athlete} /></td>
    <td><strong>{row.athlete.name}</strong><div className="muted">{row.athlete.unit || '—'}</div></td>
    <td>{row.content.name}</td>
    <td>{row.content.weightMin ?? '…'}–{row.content.weightMax ?? '…'} kg</td>
    <td>{row.athlete.weightKg ? `${row.athlete.weightKg} kg` : '—'}</td>
    <td><input className="weigh-input" disabled={locked} type="number" min="1" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Cân thực tế" /></td>
    <td><input disabled={locked} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú" /></td>
    <td><StatusBadge tone={locked ? 'success' : tone}>{locked ? 'Đã chốt cân' : statusText(row.weighIn)}</StatusBadge>{locked ? <div className="muted weigh-lock-meta">{row.weighIn.lockedByName} · {new Date(row.weighIn.lockedAt).toLocaleString('vi-VN')}</div> : null}</td>
    <td><div className="row-actions">{locked ? (isAdmin ? <button className="btn btn-small" disabled={saving} onClick={unlock}>Mở chốt cân</button> : <button className="btn btn-small" disabled>Đã chốt</button>) : <><button className="btn btn-primary btn-small" disabled={saving} onClick={save}>{saving ? 'Đang lưu' : 'Lưu cân'}</button><button className="btn btn-small" disabled={saving || !['passed', 'under', 'over'].includes(row.weighIn?.status)} onClick={lock}>Chốt cân</button></>}</div></td>
  </tr>;
}

export default function AdminWeighIns() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ keyword: '', contentId: '', unit: '', status: '' });
  const [error, setError] = useState('');
  const load = () => api.getWeighIns().then(setRows).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);
  const contents = [...new Map(rows.map((row) => [row.content.id, row.content])).values()];
  const units = [...new Set(rows.map((row) => row.athlete.unit).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'));
  const filtered = useMemo(() => rows.filter((row) => {
    const keyword = filters.keyword.trim().toLowerCase();
    if (keyword && !`${row.athlete.name} ${row.athlete.unit} ${row.content.name}`.toLowerCase().includes(keyword)) return false;
    if (filters.contentId && row.content.id !== filters.contentId) return false;
    if (filters.unit && row.athlete.unit !== filters.unit) return false;
    if (filters.status && (row.weighIn?.status || 'pending') !== filters.status) return false;
    return true;
  }), [rows, filters]);
  return <>
    <PageHeader title="Kiểm tra cân Đối kháng" subtitle="Cân sau khi bốc thăm. VĐV thiếu hoặc thừa cân bị loại và kết quả được cập nhật trực tiếp lên Sigma." />
    {error ? <div className="alert">{error}</div> : null}
    <Card><h2>Bộ lọc</h2><div className="filter-grid">
      <input placeholder="Tên VĐV, đơn vị, nội dung..." value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} />
      <select value={filters.contentId} onChange={(e) => setFilters({ ...filters, contentId: e.target.value })}><option value="">Tất cả nội dung</option>{contents.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select>
      <select value={filters.unit} onChange={(e) => setFilters({ ...filters, unit: e.target.value })}><option value="">Tất cả đơn vị</option>{units.map((unit) => <option key={unit}>{unit}</option>)}</select>
      <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">Tất cả trạng thái</option><option value="pending">Chưa cân</option><option value="passed">Đủ cân</option><option value="under">Thiếu cân</option><option value="over">Thừa cân</option></select>
    </div></Card>
    <Card><h2>Danh sách cân ({filtered.length})</h2><div className="table-wrap"><table><thead><tr><th>Ảnh</th><th>VĐV / Đơn vị</th><th>Nội dung</th><th>Hạng cân</th><th>Cân đăng ký</th><th>Cân chính thức</th><th>Ghi chú</th><th>Kết luận</th><th></th></tr></thead><tbody>
      {filtered.map((row) => <WeighRow key={`${row.athlete.id}:${row.content.id}`} row={row} onSaved={load} onError={setError} isAdmin={user?.role === 'admin'} />)}
      {!filtered.length ? <tr><td colSpan="9" className="empty">Không có VĐV phù hợp bộ lọc.</td></tr> : null}
    </tbody></table></div></Card>
  </>;
}
