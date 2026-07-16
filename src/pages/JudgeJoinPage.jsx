import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { socket } from '../socket.js';
import { Card, PageHeader, StatusBadge } from '../components/Layout.jsx';
import { statusLabel, typeLabel } from '../components/format.js';

export default function JudgeJoinPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lockedAreaId = searchParams.get('areaId') || '';
  const lockedJudgeNo = searchParams.get('judgeNo') || '';
  const [areas, setAreas] = useState([]);
  const [areaId, setAreaId] = useState(lockedAreaId);
  const [judgeNo, setJudgeNo] = useState(Number(lockedJudgeNo) || 1);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const selectedArea = areas.find((area) => area.id === areaId);
  const judgeSlots = Object.values(selectedArea?.judgeSlots || {});
  const directLinkMode = Boolean(lockedAreaId && lockedJudgeNo);

  async function load() {
    const rows = await api.getAreas();
    setAreas(rows.filter((area) => area.status !== 'locked'));
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
    const onClaimed = (payload) => navigate(payload.redirect);
    const onError = (payload) => setError(payload.message);
    socket.on('judge:claimed', onClaimed);
    socket.on('app:error', onError);
    return () => {
      socket.off('judge:claimed', onClaimed);
      socket.off('app:error', onError);
    };
  }, [navigate]);

  useEffect(() => {
    if (!areaId) return;
    api.getArea(areaId).then((state) => {
      setAreas((prev) => {
        const exists = prev.some((area) => area.id === areaId);
        if (exists) return prev.map((area) => area.id === areaId ? state.area : area);
        return [...prev, state.area];
      });
    }).catch((err) => setError(err.message));
  }, [areaId]);

  const selectedSlot = useMemo(() => {
    if (!selectedArea) return null;
    return selectedArea.judgeSlots?.[Number(judgeNo)] || null;
  }, [selectedArea, judgeNo]);

  function submit(event) {
    event.preventDefault();
    if (!areaId) return setError('Vui lòng chọn sân');
    if (!judgeNo) return setError('Vui lòng chọn số giám định');
    socket.emit('judge:claim', { areaId, judgeNo: Number(judgeNo), name: name || `Giám định ${judgeNo}` });
  }

  return (
    <div className="public-page">
      <PageHeader
        title={directLinkMode ? 'Link giám định được Admin cấp' : 'Link chung cho giám định'}
        subtitle={directLinkMode ? 'Link này đã gắn sẵn sân và số thứ tự giám định. Tổng trọng tài không dùng màn này.' : 'Chọn sân và thứ tự giám định để vào đúng màn chấm.'}
      />
      {error ? <div className="alert">{error}</div> : null}
      {directLinkMode ? (
        <div className="alert">
          Bạn đang vào link riêng: <strong>{selectedArea?.name || lockedAreaId}</strong> · <strong>Giám định {lockedJudgeNo}</strong>. Đây không phải màn Tổng trọng tài.
        </div>
      ) : null}
      <div className="two-col">
        <Card>
          <h2>Vào chấm điểm</h2>
          <form className="stack-form" onSubmit={submit}>
            <input placeholder="Tên hiển thị" value={name} onChange={(e) => setName(e.target.value)} />
            <select value={areaId} disabled={directLinkMode} onChange={(e) => { setAreaId(e.target.value); setJudgeNo(1); }}>
              <option value="">Chọn sân</option>
              {areas.map((area) => <option key={area.id} value={area.id}>{area.name} - {typeLabel(area.type)}</option>)}
            </select>
            {selectedArea ? (
              <select value={judgeNo} disabled={directLinkMode} onChange={(e) => setJudgeNo(Number(e.target.value))}>
                {judgeSlots.map((slot) => <option key={slot.judgeNo} value={slot.judgeNo} disabled={slot.status === 'connected'}>Giám định {slot.judgeNo} - {slot.status === 'connected' ? 'Đã kết nối' : 'Trống'}</option>)}
              </select>
            ) : null}
            {selectedSlot?.status === 'connected' ? <div className="alert">Vị trí này đang có người kết nối. Liên hệ Admin/Tổng trọng tài để reset nếu chọn nhầm.</div> : null}
            <button className="btn btn-primary">Vào màn chấm</button>
          </form>
        </Card>
        <Card>
          <h2>Trạng thái vị trí</h2>
          {selectedArea ? (
            <div className="judge-slot-grid">
              {judgeSlots.map((slot) => (
                <div className={`judge-slot ${Number(slot.judgeNo) === Number(judgeNo) ? 'selected-slot' : ''}`} key={slot.judgeNo}>
                  <strong>GĐ {slot.judgeNo}</strong>
                  <StatusBadge tone={slot.status === 'connected' ? 'success' : 'neutral'}>{statusLabel(slot.status)}</StatusBadge>
                  <small>{slot.name || 'Chưa có'}</small>
                </div>
              ))}
            </div>
          ) : <p>Chọn sân để xem vị trí trống.</p>}
        </Card>
      </div>
    </div>
  );
}
