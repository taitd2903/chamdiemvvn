import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket.js';
import { Card, PageHeader, StatusBadge } from '../components/Layout.jsx';
import { useAreaState } from '../components/hooks.js';
import { statusLabel } from '../components/format.js';
import { AthletePhoto } from '../components/AthletePhoto.jsx';

function getScoreTone(current, score) {
  if (score === undefined || score === null || current?.finalScore === null) return '';
  if (Number(score) === Number(current.removedHigh)) return ' removed-high';
  if (Number(score) === Number(current.removedLow)) return ' removed-low';
  return ' kept-score';
}

function ScoreBox({ current, judgeNo, score, onClear }) {
  const tone = getScoreTone(current, score);
  return (
    <div className={`form-score-box${score !== undefined && score !== null ? ' has-score' : ''}${tone}`}>
      <span>GĐ{judgeNo}</span>
      <strong>{score ?? '-'}</strong>
      {score !== undefined && score !== null ? (
        <button className="btn btn-small" onClick={onClear}>Xóa điểm</button>
      ) : <small>Chưa nhập</small>}
    </div>
  );
}

export default function FormRefereePage() {
  const { areaId } = useParams();
  const { state, error } = useAreaState(areaId);
  const current = state?.currentFormEntry;
  const entries = useMemo(() => [...(state?.formEntries || [])].sort((a, b) => a.orderNo - b.orderNo), [state]);
  const currentIndex = current ? entries.findIndex((entry) => entry.id === current.id) : -1;
  const currentContent = current ? state?.contents?.find((content) => content.id === current.contentId) : null;
  const screenUrl = `${window.location.origin}/forms/area/${areaId}/screen`;
  const tournamentName = state?.settings?.tournamentName || 'GIẢI VOVINAM';

  function emit(event, payload = {}) {
    socket.emit(event, { areaId, ...payload });
  }

  function copyScreenUrl() {
    navigator.clipboard?.writeText(screenUrl);
    alert('Đã copy link màn hình Quyền');
  }

  function openScreen() {
    window.open(screenUrl, '_blank', 'noopener,noreferrer');
  }

  function selectEntry(entryId) {
    emit('form:select-entry', { entryId });
  }

  function selectRelative(offset) {
    if (!entries.length) return;
    const fallbackIndex = offset > 0 ? 0 : entries.length - 1;
    const nextIndex = currentIndex === -1 ? fallbackIndex : currentIndex + offset;
    if (nextIndex < 0 || nextIndex >= entries.length) return;
    selectEntry(entries[nextIndex].id);
  }

  function updateEntry(entryId, status) {
    emit('form:update-status', { entryId, status });
  }

  function clearScore(entryId, judgeNo) {
    if (!confirm(`Xóa điểm của GĐ${judgeNo}?`)) return;
    emit('form:clear-score', { entryId, judgeNo });
  }

  function resetEntry(entryId) {
    if (!confirm('Reset điểm lượt này? Toàn bộ điểm đã nhập sẽ bị xóa.')) return;
    emit('form:reset-entry', { entryId });
  }

  function calculateEntry(entryId) {
    emit('form:calculate', { entryId });
  }

  const enteredCount = current ? Object.keys(current.scores || {}).length : 0;

  return (
    <div className="public-page referee-page form-referee-page">
      <PageHeader
        title={`Tổng trọng tài Quyền - ${state?.area?.name || areaId}`}
        subtitle="Tổng trọng tài Quyền điều hành lượt thi, không nằm trong 5 giám định."
        actions={(
          <>
            <button className="btn" onClick={copyScreenUrl}>Copy link trình chiếu</button>
            <button className="btn btn-primary" onClick={openScreen}>Mở màn hình trình chiếu</button>
          </>
        )}
      />
      {error ? <div className="alert">{error}</div> : null}

      <Card className="form-arena-board referee-version">
        <div className="form-display-header">
          <div className="logo-placeholder small-logo">Logo</div>
          <h1>{tournamentName}</h1>
          <div className="logo-placeholder small-logo">Logo</div>
        </div>

        <div className="form-content-nav">
          <button className="btn" disabled={currentIndex <= 0} onClick={() => selectRelative(-1)}>← Trước</button>
          <strong>🏆 {currentContent?.name || 'Chưa chọn nội dung'}</strong>
          <button className="btn" disabled={currentIndex === -1 || currentIndex >= entries.length - 1} onClick={() => selectRelative(1)}>Sau →</button>
        </div>

        {current ? <div className="form-athlete-photo"><AthletePhoto athlete={current} size="large" /></div> : null}
        <div className="form-athlete-info">
          <p>🥋 <span>VĐV/Đội:</span> <strong>{current?.participantName || 'Chưa chọn lượt thi'}</strong></p>
          <p>🏫 <span>Đơn vị:</span> <strong>{current?.participantUnit || '—'}</strong></p>
          <p>👥 <span>Nhóm tuổi:</span> <strong>{current?.ageGroup || '—'}</strong></p>
          <p>⚧ <span>Giới tính:</span> <strong>{current?.gender === 'male' ? 'Nam' : current?.gender === 'female' ? 'Nữ' : current?.gender === 'other' ? 'Khác' : '—'}</strong></p>
          <p>⚖️ <span>Hạng cân:</span> <strong>{current?.weightKg ? `${current.weightKg}kg` : '—'}{current?.weightClass ? ` · ${current.weightClass}` : ''}</strong></p>
          <p>📍 <span>Sân:</span> <strong>{state?.area?.name || areaId}</strong></p>
        </div>

        {current ? (
          <>
            <div className="judge-score-row display-style">
              {Array.from({ length: 5 }).map((_, index) => {
                const no = index + 1;
                return (
                  <ScoreBox
                    key={no}
                    current={current}
                    judgeNo={no}
                    score={current.scores?.[no]}
                    onClear={() => clearScore(current.id, no)}
                  />
                );
              })}
            </div>

            <div className="total-score-panel">
              <span>Tổng điểm</span>
              <strong>{current.finalScore ?? '—'}</strong>
            </div>

            <div className="form-final-detail centered">
              <span>Đã nhập: <strong>{enteredCount}/5</strong></span>
              <span>Bỏ thấp nhất: <strong>{current.removedLow ?? '-'}</strong></span>
              <span>Bỏ cao nhất: <strong>{current.removedHigh ?? '-'}</strong></span>
              <span>Giữ lại: <strong>{(current.keptScores || []).join(' + ') || '-'}</strong></span>
            </div>

            <div className="row-actions form-control-row">
              <button className="btn" onClick={() => selectRelative(-1)} disabled={currentIndex <= 0}>← Trước</button>
              <button className="btn" onClick={() => selectRelative(1)} disabled={currentIndex === -1 || currentIndex >= entries.length - 1}>Sau →</button>
              <button className="btn" onClick={() => calculateEntry(current.id)}>Tính điểm</button>
              <button className="btn" onClick={() => updateEntry(current.id, 'skipped')}>Bỏ qua lượt</button>
              <button className="btn" onClick={() => resetEntry(current.id)}>Reset điểm</button>
              <button className="btn btn-danger" onClick={() => updateEntry(current.id, 'cancelled')}>Hủy lượt</button>
            </div>
          </>
        ) : (
          <div className="empty big-empty">Chọn một lượt thi bên dưới để bắt đầu chấm điểm sân Quyền.</div>
        )}
      </Card>

      <div className="referee-grid">
        <Card>
          <h2>Trạng thái 5 giám định</h2>
          <div className="judge-slot-grid">
            {Object.values(state?.area?.judgeSlots || {}).map((slot) => (
              <div className="judge-slot" key={slot.judgeNo}>
                <strong>GĐ {slot.judgeNo}</strong>
                <StatusBadge tone={slot.status === 'connected' ? 'success' : 'neutral'}>{statusLabel(slot.status)}</StatusBadge>
                <small>{slot.name || 'Chưa có'}</small>
                <button className="btn btn-small" onClick={() => emit('referee:reset-judge', { judgeNo: slot.judgeNo })}>Reset</button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2>Danh sách lượt thi</h2>
          <p className="note">Có thể bỏ qua người chưa sẵn sàng, chọn người khác thi trước rồi quay lại sau.</p>
          <div className="queue-list compact-queue">
            {entries.map((entry) => (
              <div className={`queue-row ${current?.id === entry.id ? 'active' : ''}`} key={entry.id}>
                <span className="athlete-with-photo"><AthletePhoto athlete={entry} size="small" />{entry.orderNo}. {entry.participantName}</span>
                <StatusBadge>{statusLabel(entry.status)}</StatusBadge>
                <strong>{entry.finalScore ?? '-'}</strong>
                <div className="row-actions">
                  <button className="btn btn-small" onClick={() => selectEntry(entry.id)}>Chấm điểm</button>
                  <button className="btn btn-small" onClick={() => updateEntry(entry.id, 'skipped')}>Bỏ qua</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
