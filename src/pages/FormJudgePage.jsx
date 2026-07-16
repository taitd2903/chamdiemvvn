import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { socket } from '../socket.js';
import { Card, PageHeader, StatusBadge } from '../components/Layout.jsx';
import { useAreaState } from '../components/hooks.js';
import { statusLabel } from '../components/format.js';

export default function FormJudgePage() {
  const { areaId, judgeNo } = useParams();
  const { state, error } = useAreaState(areaId);
  const [score, setScore] = useState('');
  const current = state?.currentFormEntry;
  const isCompleted = current?.status === 'completed';

  function submit(event) {
    event.preventDefault();
    if (!current) return;
    socket.emit('form:score', { areaId, entryId: current.id, judgeNo: Number(judgeNo), score: Number(score) });
  }

  return (
    <div className="public-page compact">
      <PageHeader title={`Giám định ${judgeNo} - ${state?.area?.name || ''}`} subtitle="Màn chấm Quyền: nhập điểm tối đa 100." />
      {error ? <div className="alert">{error}</div> : null}
      <Card className="judge-card">
        <h2>Lượt thi hiện tại</h2>
        {current ? (
          <>
            <div className="big-name">{current.participantName}</div>
            <StatusBadge>{statusLabel(current.status)}</StatusBadge>
            <div className="score-list">
              {Array.from({ length: 5 }).map((_, index) => {
                const no = index + 1;
                return <span key={no}>GĐ{no}: {current.scores?.[no] ?? '-'}</span>;
              })}
            </div>
            {current.finalScore !== null ? <div className="final-score">Điểm cuối: {current.finalScore}</div> : null}
          </>
        ) : <p>Chưa chọn lượt thi.</p>}
      </Card>
      <Card>
        <form className="score-form" onSubmit={submit}>
          <input type="number" min="0" max="100" step="0.01" placeholder="Nhập điểm" value={score} onChange={(e) => setScore(e.target.value)} disabled={!current || isCompleted} />
          <button className="btn btn-primary btn-large" disabled={!current || isCompleted}>Gửi điểm</button>
        </form>
        <p className="note">Quyền bắt buộc 5 giám định. Hệ thống bỏ điểm cao nhất, thấp nhất và cộng tổng 3 điểm còn lại.</p>
      </Card>
    </div>
  );
}
