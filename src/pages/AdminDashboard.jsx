import { Link } from 'react-router-dom';
import { Card, PageHeader, StatusBadge } from '../components/Layout.jsx';
import { useGlobalState } from '../components/hooks.js';
import { statusLabel, typeLabel } from '../components/format.js';

export default function AdminDashboard() {
  const { state, error } = useGlobalState();
  const areas = state?.areas || [];
  const formCount = areas.filter((area) => area.type === 'form').length;
  const fightingCount = areas.filter((area) => area.type === 'fighting').length;

  return (
    <>
      <PageHeader title="Dashboard Admin" subtitle="Tổng quan giải Vovinam realtime" actions={<Link className="btn btn-primary" to="/admin/links">Cấp link / QR</Link>} />
      {error ? <div className="alert">{error}</div> : null}
      <div className="stats-grid">
        <Card><p>Tổng sân</p><strong>{areas.length}</strong></Card>
        <Card><p>Sân Quyền</p><strong>{formCount}</strong></Card>
        <Card><p>Sân Đối kháng</p><strong>{fightingCount}</strong></Card>
        <Card><p>Nội dung</p><strong>{state?.contents?.length || 0}</strong></Card>
      </div>
      <Card>
        <h2>Trạng thái sân</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Sân</th><th>Loại</th><th>Trạng thái</th><th>Giám định</th><th>Link</th></tr></thead>
            <tbody>
              {areas.map((area) => (
                <tr key={area.id}>
                  <td>{area.name}</td>
                  <td>{typeLabel(area.type)}</td>
                  <td><StatusBadge>{statusLabel(area.status)}</StatusBadge></td>
                  <td>{Object.values(area.judgeSlots || {}).filter((slot) => slot.status === 'connected').length}/{area.judgeCount}</td>
                  <td>
                    <Link className="btn btn-small" to="/admin/links">Xem link / QR</Link>
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
