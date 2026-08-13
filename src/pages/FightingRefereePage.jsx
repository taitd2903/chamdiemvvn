import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket.js';
import { Card, PageHeader, StatusBadge } from '../components/Layout.jsx';
import FightVoteMatrix from '../components/FightVoteMatrix.jsx';
import { useAreaState } from '../components/hooks.js';
import { formatTime, resultText, statusLabel } from '../components/format.js';

function contentTitle(state, match) {
  const content = state?.contents?.find((item) => item.id === match?.contentId);
  return content?.name || 'Đối kháng';
}

function sideStats(match, side) {
  const reminders = match?.reminders?.[side] || {};
  const medical = match?.medicalCounts?.[side] || { total: 0, byRound: {} };
  return [
    { label: 'Nhắc lỗi', value: reminders.fault || 0 },
    { label: `Y tế H${match?.round || 1}/Tổng`, value: `${medical.byRound?.[match?.round] || 0}/${medical.total || 0}` },
    { label: 'Cảnh cáo', value: reminders.warnings || 0 }
  ];
}

function HistoryColumn({ match, side }) {
  const rows = [...(match?.history || [])].filter((item) => item.side === side || item.winner === side).reverse().slice(0, 40);
  return <section className={`side-history side-history-${side}`}>
    <h3>{side === 'red' ? 'GIÁP ĐỎ' : 'GIÁP XANH'}</h3>
    {rows.map((item) => <article className={item.undone ? 'history-undone' : ''} key={item.id}>
      <strong>{item.label}</strong>
      <small>Hiệp {item.round ?? '-'} · còn {formatTime(item.remainingSeconds)} · tỷ số {item.redScoreAfter ?? '-'}–{item.blueScoreAfter ?? '-'}</small>
      <small>{new Date(item.at).toLocaleTimeString('vi-VN')}{item.source === 'judges' ? ' · Giám định đồng thuận' : item.source === 'referee' ? ' · Tổng trọng tài' : ''}</small>
      {item.undone ? <b>ĐÃ HOÀN TÁC</b> : null}
    </article>)}
    {!rows.length ? <div className="empty">Chưa có thao tác</div> : null}
  </section>;
}

function RefereeSideCard({ match, side }) {
  const isRed = side === 'red';
  const isWinner = match.status === 'finished' && match.winner === side;
  const unit = isRed ? match.redUnit : match.blueUnit;
  const name = isRed ? match.redName : match.blueName;
  const score = isRed ? match.redScore : match.blueScore;
  const stats = sideStats(match, side);
  const medicalSeconds = Number(match?.medicalTimers?.[side] || 0);

  return (
    <section className={`referee-side-card ${isRed ? 'referee-red' : 'referee-blue'} ${isWinner ? 'referee-winner' : ''}`}>
      <div className="referee-unit-name">{unit || 'Chưa có đơn vị'}</div>
      <div className="referee-score-number">{score}</div>
      <div className="referee-athlete-name">{name}</div>
      {medicalSeconds > 0 ? <div className="medical-countdown">Y TẾ · {formatTime(medicalSeconds)}</div> : null}
      <div className="referee-stats-row">
        {stats.map((item) => (
          <div className="referee-stat" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function FightingRefereePage() {
  const { areaId } = useParams();
  const { state, error } = useAreaState(areaId);
  const match = state?.currentFightMatch;
  const matches = useMemo(
    () => [...(state?.fightMatches || [])]
      .filter((item) => item.status !== 'cancelled')
      .sort((a, b) => a.orderNo - b.orderNo),
    [state]
  );
  const nextMatch = useMemo(() => {
    if (!match || match.status !== 'finished') return null;
    const currentIndex = matches.findIndex((item) => item.id === match.id);
    return matches.slice(Math.max(0, currentIndex + 1)).find((item) => ['pending', 'skipped'].includes(item.status)) || null;
  }, [match, matches]);
  const screenUrl = `${window.location.origin}/fighting/area/${areaId}/screen`;

  function emit(event, payload = {}) {
    socket.emit(event, { areaId, ...payload });
  }

  function selectMatch(matchId) {
    socket.emit('fight:select-match', { areaId, matchId });
  }

  function copyScreenUrl() {
    navigator.clipboard?.writeText(screenUrl);
    alert('Đã copy link màn hình tổng điểm');
  }

  const medicalActive = Number(match?.medicalTimers?.red || 0) > 0 || Number(match?.medicalTimers?.blue || 0) > 0;
  const isRunning = ['running', 'golden'].includes(match?.status);
  const canToggleTest = Boolean(match && (match.testMode || (!match.hasStarted && match.status === 'pending')));
  const mainControl = medicalActive
    ? { label: 'Đang y tế', event: null }
    : match?.status === 'finished'
      ? { label: 'Trận đã kết thúc', event: null }
    : match?.status === 'break'
      ? { label: 'Đang nghỉ giữa hiệp', event: null }
    : match?.status === 'decision'
      ? { label: 'Chờ trọng tài quyết định', event: null }
    : isRunning
      ? { label: 'Tạm dừng', event: 'fight:pause' }
      : match?.status === 'paused'
        ? { label: 'Tiếp tục', event: 'fight:resume' }
        : { label: 'Bắt đầu', event: 'fight:start' };

  return (
    <div className="public-page referee-page">
      <PageHeader
        title={`Tổng trọng tài - ${state?.area?.name || areaId}`}
        subtitle={`Tổng trọng tài cố định theo sân, không nằm trong ${state?.area?.judgeCount || 5} giám định, điều khiển trận và chia sẻ màn tổng điểm.`}
        actions={<>
          <button
            className={`btn ${match?.testMode ? 'btn-danger' : ''}`}
            disabled={!canToggleTest}
            onClick={() => emit('fight:test-mode', { enabled: !match?.testMode })}
          >{match?.testMode ? 'Tắt test điểm' : 'Test điểm'}</button>
          <button className="btn btn-primary" onClick={copyScreenUrl}>Chia sẻ màn tổng điểm</button>
        </>}
      />
      {error ? <div className="alert">{error}</div> : null}
      <div className="referee-operation-grid">
        <Card className="score-board-card">
          {match ? (
            <>
              <div className="fight-match-strip">
                <span>Trận {match.orderNo}</span>
                <strong>{contentTitle(state, match)}</strong>
                <StatusBadge>{match.testMode ? 'ĐANG TEST ĐIỂM' : statusLabel(match.status)}</StatusBadge>
              </div>
              <div className="referee-fight-display">
                <section className="referee-time-top">
                  <span>Thời gian</span>
                  <strong>{formatTime(match.remainingSeconds)}</strong>
                  <small>Nghỉ giữa hiệp: {formatTime(match.breakSeconds ?? 45)}</small>
                </section>

                <div className="referee-score-layout">
                  <RefereeSideCard match={match} side="red" />
                  <section className="referee-center-card">
                    <span>Hiệp</span>
                    <strong>{match.round}</strong>
                    <StatusBadge>{statusLabel(match.status)}</StatusBadge>
                    {match.goldenPoint ? <div className="golden-label">ĐIỂM VÀNG</div> : null}
                  </section>
                  <RefereeSideCard match={match} side="blue" />
                </div>

                <div className="center-meta"><strong>Kết quả:</strong> {resultText(match)}</div>

                <div className="referee-vote-row">
                  <FightVoteMatrix area={state?.area} match={match} side="red" />
                  <FightVoteMatrix area={state?.area} match={match} side="blue" />
                </div>
              </div>
            </>
          ) : <p>Chưa chọn trận.</p>}
        </Card>
        <div className="referee-operation-controls">
        <Card className="referee-control-card">
          <h2>Điều khiển trận</h2>
          <div className="button-grid">
            <button className="btn btn-primary main-match-control" disabled={!match || !mainControl.event} onClick={() => mainControl.event && emit(mainControl.event)}>{mainControl.label}</button>
            <button className="btn" disabled={!match || match.testMode || ['pending', 'finished', 'cancelled', 'decision'].includes(match.status)} onClick={() => emit('fight:next-round')}>Sang hiệp</button>
            <button className="btn" disabled={!match || match.round <= 1 || ['finished', 'cancelled', 'decision'].includes(match.status)} onClick={() => emit('fight:previous-round')}>Quay lại hiệp trước</button>
            <button className="btn" onClick={() => emit('fight:undo')}>Hoàn tác hành động</button>
            {match?.status === 'finished' ? <button className="btn btn-primary next-fight-control" disabled={!nextMatch} onClick={() => nextMatch && selectMatch(nextMatch.id)}>{nextMatch ? `Chuyển sang trận ${nextMatch.orderNo}` : 'Đã hết trận tại sân'}</button> : null}
          </div>
        </Card>
        <Card className="referee-control-card referee-score-actions">
          <h2>Cộng/trừ trực tiếp</h2>
          <div className="direct-score-columns">
            <section className="direct-score-side direct-score-red">
              <strong>GIÁP ĐỎ</strong>
              <div className="direct-score-stack"><span>CỘNG</span>
                <button className="btn red-button" onClick={() => emit('fight:manual-score', { side: 'red', points: 1 })}>+1</button>
                <button className="btn red-button" onClick={() => emit('fight:manual-score', { side: 'red', points: 2 })}>+2</button>
                <button className="btn red-button absolute-kick" aria-label="Đỏ +3" onClick={() => emit('fight:manual-score', { side: 'red', points: 3 })}>+3</button>
              </div>
              <div className="direct-score-stack"><span>TRỪ</span>
                <button className="btn red-button outline" onClick={() => emit('fight:manual-score', { side: 'red', points: -1 })}>-1</button>
                <button className="btn red-button outline" onClick={() => emit('fight:manual-score', { side: 'red', points: -2 })}>-2</button>
              </div>
            </section>
            <section className="direct-score-side direct-score-blue">
              <strong>GIÁP XANH</strong>
              <div className="direct-score-stack"><span>CỘNG</span>
                <button className="btn blue-button" onClick={() => emit('fight:manual-score', { side: 'blue', points: 1 })}>+1</button>
                <button className="btn blue-button" onClick={() => emit('fight:manual-score', { side: 'blue', points: 2 })}>+2</button>
                <button className="btn blue-button absolute-kick" aria-label="Xanh +3" onClick={() => emit('fight:manual-score', { side: 'blue', points: 3 })}>+3</button>
              </div>
              <div className="direct-score-stack"><span>TRỪ</span>
                <button className="btn blue-button outline" onClick={() => emit('fight:manual-score', { side: 'blue', points: -1 })}>-1</button>
                <button className="btn blue-button outline" onClick={() => emit('fight:manual-score', { side: 'blue', points: -2 })}>-2</button>
              </div>
            </section>
          </div>
          <h3>Nhắc lỗi / y tế</h3>
          <div className="direct-score-columns reminder-action-columns">
            <section className="direct-score-side direct-score-red">
              <strong>GIÁP ĐỎ</strong>
              <button className="btn red-button outline" onClick={() => emit('fight:reminder', { side: 'red', kind: 'fault' })}>Nhắc lỗi</button>
              <button className="btn red-button outline" onClick={() => emit('fight:reminder', { side: 'red', kind: 'medical' })}>Y tế 60s</button>
            </section>
            <section className="direct-score-side direct-score-blue">
              <strong>GIÁP XANH</strong>
              <button className="btn blue-button outline" onClick={() => emit('fight:reminder', { side: 'blue', kind: 'fault' })}>Nhắc lỗi</button>
              <button className="btn blue-button outline" onClick={() => emit('fight:reminder', { side: 'blue', kind: 'medical' })}>Y tế 60s</button>
            </section>
          </div>
          <h3>Chiến thắng trực tiếp</h3>
          <div className="manual-score-grid two">
            <button className="btn red-button" disabled={!match || match.testMode || ['pending', 'finished', 'cancelled'].includes(match.status)} onClick={() => emit('fight:win', { winner: 'red' })}>Đỏ thắng</button>
            <button className="btn blue-button" disabled={!match || match.testMode || ['pending', 'finished', 'cancelled'].includes(match.status)} onClick={() => emit('fight:win', { winner: 'blue' })}>Xanh thắng</button>
          </div>
        </Card>
        </div>
      </div>

      <Card className="referee-queue-card">
        <h2>Danh sách trận sân này</h2>
        <div className="queue-list">
          {matches.map((item) => (
            <div className={`queue-row ${match?.id === item.id ? 'active' : ''}`} key={item.id}>
              <span>Trận {item.orderNo} · {item.redName} vs {item.blueName}</span>
              <StatusBadge>{statusLabel(item.status)}</StatusBadge>
              <strong>{item.redScore} - {item.blueScore}</strong>
              <button className="btn btn-small" onClick={() => selectMatch(item.id)}>Chọn trận</button>
            </div>
          ))}
        </div>
      </Card>
      <Card className="referee-history-card">
        <h2>Lịch sử điểm và thao tác</h2>
        <div className="side-history-grid"><HistoryColumn match={match} side="red" /><HistoryColumn match={match} side="blue" /></div>
      </Card>
      <Card className="referee-judges-last">
        <h2>Danh sách giám định</h2>
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
    </div>
  );
}
