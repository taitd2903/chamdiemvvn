import { useParams } from 'react-router-dom';
import { socket } from '../socket.js';
import { Card, PageHeader, StatusBadge } from '../components/Layout.jsx';
import { useAreaState } from '../components/hooks.js';
import { formatTime, statusLabel } from '../components/format.js';

export default function FightingJudgePage() {
  const { areaId, judgeNo } = useParams();
  const { state, error } = useAreaState(areaId);
  const match = state?.currentFightMatch;
  const canVote = ['running', 'golden'].includes(match?.status);

  function vote(side, points) {
    socket.emit('fight:vote', { areaId, judgeNo: Number(judgeNo), side, points });
  }

  return (
    <div className="public-page compact">
      <PageHeader title={`Giám định ${judgeNo} - ${state?.area?.name || ''}`} subtitle="Màn bấm điểm Đối kháng: +1 và +2 không gộp chung." />
      {error ? <div className="alert">{error}</div> : null}
      <Card className="fight-summary-card">
        {match ? (
          <>
            <div className="match-line">
              <strong className="red-text">{match.redName}</strong>
              <span>{match.redScore} - {match.blueScore}</span>
              <strong className="blue-text">{match.blueName}</strong>
            </div>
            <div className="center-meta">
              <StatusBadge>{statusLabel(match.status)}</StatusBadge>
              <span>Hiệp {match.round}</span>
              <span>{formatTime(match.remainingSeconds)}</span>
            </div>
          </>
        ) : <p>Chưa chọn trận.</p>}
      </Card>
      <div className="judge-fight-grid">
        <Card className="red-panel">
          <h2>Đỏ</h2>
          <button className="vote-btn" disabled={!canVote} onClick={() => vote('red', 1)}>+1</button>
          <button className="vote-btn" disabled={!canVote} onClick={() => vote('red', 2)}>+2</button>
        </Card>
        <Card className="blue-panel">
          <h2>Xanh</h2>
          <button className="vote-btn" disabled={!canVote} onClick={() => vote('blue', 1)}>+1</button>
          <button className="vote-btn" disabled={!canVote} onClick={() => vote('blue', 2)}>+2</button>
        </Card>
      </div>
      <p className="note">Điểm chỉ được công nhận khi có 3 giám định bấm cùng bên, cùng loại điểm trong 3 giây.</p>
    </div>
  );
}
