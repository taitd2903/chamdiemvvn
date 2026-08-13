import { useParams } from 'react-router-dom';
import { socket } from '../socket.js';
import { Card, PageHeader } from '../components/Layout.jsx';
import { useAreaState } from '../components/hooks.js';

export default function FightingJudgePage() {
  const { areaId, judgeNo } = useParams();
  const { state, error } = useAreaState(areaId);
  const match = state?.currentFightMatch;
  const canVote = Boolean(match?.testMode || ['running', 'golden'].includes(match?.status));

  function vote(side, points) {
    socket.emit('fight:vote', { areaId, judgeNo: Number(judgeNo), side, points });
  }

  return (
    <div className="public-page compact judge-page fighting-judge-page">
      <PageHeader title={`Giám định ${judgeNo} - ${state?.area?.name || ''}`} subtitle={match?.testMode ? 'ĐANG TEST ĐIỂM · Có thể bấm thử +1 và +2.' : 'Màn bấm điểm Đối kháng: +1 và +2 không gộp chung.'} />
      {error ? <div className="alert">{error}</div> : null}
      <div className="judge-fight-grid">
        <Card className="red-panel">
          <h2>Đỏ</h2>
          <button className="vote-btn vote-btn-one" disabled={!canVote} onClick={() => vote('red', 1)}>+1</button>
          <button className="vote-btn vote-btn-two" disabled={!canVote} onClick={() => vote('red', 2)}>+2</button>
        </Card>
        <Card className="blue-panel">
          <h2>Xanh</h2>
          <button className="vote-btn vote-btn-one" disabled={!canVote} onClick={() => vote('blue', 1)}>+1</button>
          <button className="vote-btn vote-btn-two" disabled={!canVote} onClick={() => vote('blue', 2)}>+2</button>
        </Card>
      </div>
      <p className="note">Điểm chỉ được công nhận khi có 3 giám định bấm cùng bên, cùng loại điểm trong 3 giây.</p>
    </div>
  );
}
