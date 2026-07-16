import { useEffect, useMemo, useState } from 'react';

function getLatestFlash(match, judgeNo, side, now) {
  const flashes = [...(match?.voteFlashes || [])]
    .filter((vote) => (
      Number(vote.judgeNo) === Number(judgeNo) &&
      vote.side === side &&
      now - Number(vote.timestamp) <= 2200
    ))
    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
  return flashes[0] ? { ...flashes[0], flash: true } : null;
}

function getLatestVote(match, judgeNo, side, now) {
  const flash = getLatestFlash(match, judgeNo, side, now);
  if (flash) return flash;

  const votes = [...(match?.pendingVotes || [])]
    .filter((vote) => (
      Number(vote.judgeNo) === Number(judgeNo) &&
      vote.side === side &&
      now - Number(vote.timestamp) <= 6000
    ))
    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
  return votes[0] || null;
}

function voteClass(vote, now) {
  if (!vote) return '';
  const age = now - Number(vote.timestamp);
  if (vote.flash && age <= 2200) return 'is-flash';
  if (vote.used) return 'is-used';
  if (age <= 3000) return 'is-active';
  return 'is-stale';
}

function hasRecentVotes(match) {
  const now = Date.now();
  return [...(match?.voteFlashes || []), ...(match?.pendingVotes || [])]
    .some((vote) => now - Number(vote.timestamp) <= 6000);
}

export default function FightVoteMatrix({ area, match, side, screen = false }) {
  const [now, setNow] = useState(Date.now());
  const slots = useMemo(() => Object.values(area?.judgeSlots || {})
    .sort((a, b) => Number(a.judgeNo) - Number(b.judgeNo)), [area]);
  const label = side === 'red' ? 'Đỏ' : 'Xanh';

  useEffect(() => {
    if (!hasRecentVotes(match)) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 180);
    return () => clearInterval(timer);
  }, [match?.id, match?.pendingVotes?.length, match?.voteFlashes?.length]);

  return (
    <aside className={`vote-matrix vote-matrix-${side} ${screen ? 'vote-matrix-screen' : ''}`}>
      <div className="vote-matrix-title">Phiếu {label}</div>
      <div className="vote-indicator-grid">
        {slots.map((slot) => {
          const vote = getLatestVote(match, slot.judgeNo, side, now);
          const indicatorClass = voteClass(vote, now);
          const hasFlash = indicatorClass === 'is-flash';
          return (
            <div className={`vote-indicator-item ${slot.status === 'connected' ? 'is-online' : ''} ${hasFlash ? 'has-flash' : ''}`} key={slot.judgeNo}>
              <span className="vote-judge-label">GĐ{slot.judgeNo}</span>
              <span className={`vote-indicator ${indicatorClass}`} aria-label={`Phiếu ${label} GĐ${slot.judgeNo}`} />
            </div>
          );
        })}
      </div>
    </aside>
  );
}
