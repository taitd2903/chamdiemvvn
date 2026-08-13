import { useParams } from 'react-router-dom';
import { Card, StatusBadge } from '../components/Layout.jsx';
import FightVoteMatrix from '../components/FightVoteMatrix.jsx';
import { useAreaState } from '../components/hooks.js';
import { formatTime, resultText, statusLabel } from '../components/format.js';

function contentTitle(state, match) {
  const content = state?.contents?.find((item) => item.id === match?.contentId);
  return content?.name || 'Đối kháng';
}

function sideStats(match, side) {
  const reminders = match?.reminders?.[side] || {};
  return [
    { label: 'Nhắc nhở', icon: '✋', iconClass: 'reminder-hand', value: reminders.fault || 0 },
    { label: 'Cứu thương', icon: '✚', iconClass: 'medical-cross', value: reminders.medical || 0 },
    { label: 'Cảnh cáo', icon: '', iconClass: 'warning-sign', value: reminders.warnings || 0 }
  ];
}

function FightProjectionSide({ match, side }) {
  const isRed = side === 'red';
  const isWinner = match.status === 'finished' && match.winner === side;
  const unit = isRed ? match.redUnit : match.blueUnit;
  const name = isRed ? match.redName : match.blueName;
  const score = isRed ? match.redScore : match.blueScore;
  const stats = sideStats(match, side);
  const medicalSeconds = Number(match?.medicalTimers?.[side] || 0);

  return (
    <section className={`projection-side-card ${isRed ? 'projection-red' : 'projection-blue'} ${isWinner ? 'projection-winner' : ''}`}>
      <div className="projection-unit-name">{unit || 'Chưa có đơn vị'}</div>
      <div className="projection-score-number">{score}</div>
      <div className="projection-athlete-name">{name}</div>
      {medicalSeconds > 0 ? <div className="medical-countdown">Y TẾ · {formatTime(medicalSeconds)}</div> : null}
      <div className="projection-stats-row">
        {stats.map((item) => (
          <div className="projection-stat" key={item.label}>
            <span className="projection-stat-label"><i className={`projection-stat-icon ${item.iconClass}`} aria-hidden="true">{item.icon}</i>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function FightingScreenPage() {
  const { areaId } = useParams();
  const { state, error } = useAreaState(areaId);
  const match = state?.currentFightMatch;
  const tournamentName = state?.settings?.tournamentName || 'GIẢI VOVINAM';
  const logoLeftUrl = state?.settings?.logoLeftUrl;
  const logoRightUrl = state?.settings?.logoRightUrl;

  return (
    <div className="screen-page fighting-screen">
      {error ? <div className="alert">{error}</div> : null}
      <div className="fight-presentation-title">
        {logoLeftUrl ? <img src={logoLeftUrl} alt="Logo trái" /> : <span />}
        <h1>{tournamentName}</h1>
        {logoRightUrl ? <img src={logoRightUrl} alt="Logo phải" /> : <span />}
      </div>

      {match ? (
        <>
          <div className="screen-match-strip fight-category-strip">
            <span>{state?.area?.name || areaId}</span>
            <strong>{contentTitle(state, match)}</strong>
            <span>Trận {match.orderNo}</span>
          </div>

          <section className="projection-timer-top">
            <span>Thời gian</span>
            <strong>{formatTime(match.remainingSeconds)}</strong>
          </section>

          <div className="projection-fight-board">
            <FightProjectionSide match={match} side="red" />

            <section className="projection-center-card">
              <span>Hiệp</span>
              <strong>{match.round}</strong>
              <StatusBadge>{statusLabel(match.status)}</StatusBadge>
              {match.goldenPoint ? <div className="golden-label">ĐIỂM VÀNG</div> : null}
            </section>

            <FightProjectionSide match={match} side="blue" />
          </div>

          <div className="screen-result">{resultText(match)}</div>

          <div className="projection-vote-row">
            <FightVoteMatrix area={state?.area} match={match} side="red" screen />
            <FightVoteMatrix area={state?.area} match={match} side="blue" screen />
          </div>
        </>
      ) : (
        <Card className="screen-card"><div className="screen-name">Chưa chọn trận</div></Card>
      )}
    </div>
  );
}
