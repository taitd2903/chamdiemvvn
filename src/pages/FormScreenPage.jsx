import { useParams } from 'react-router-dom';
import { useAreaState } from '../components/hooks.js';
import { AthletePhoto } from '../components/AthletePhoto.jsx';

function getScoreTone(current, score) {
  if (score === undefined || score === null || current?.finalScore === null) return '';
  if (Number(score) === Number(current.removedHigh)) return ' removed-high';
  if (Number(score) === Number(current.removedLow)) return ' removed-low';
  return ' kept-score';
}

export default function FormScreenPage() {
  const { areaId } = useParams();
  const { state, error } = useAreaState(areaId);
  const current = state?.currentFormEntry;
  const currentContent = current ? state?.contents?.find((content) => content.id === current.contentId) : null;
  const tournamentName = state?.settings?.tournamentName || 'GIẢI VOVINAM';
  const logoLeftUrl = state?.settings?.logoLeftUrl;
  const logoRightUrl = state?.settings?.logoRightUrl;
  const enteredCount = current ? Object.keys(current.scores || {}).length : 0;
  const isFullyScored = Boolean(current && enteredCount === 5 && current.finalScore !== null && current.finalScore !== undefined);

  return (
    <div className="form-presentation-page">
      {error ? <div className="alert">{error}</div> : null}
      <div className="form-display-header presentation-header">
        {logoLeftUrl ? <img src={logoLeftUrl} alt="Logo trái" /> : <div className="logo-placeholder small-logo">Logo</div>}
        <h1>{tournamentName}</h1>
        {logoRightUrl ? <img src={logoRightUrl} alt="Logo phải" /> : <div className="logo-placeholder small-logo">Logo</div>}
      </div>

      <div className="presentation-content-title">🏆 {currentContent?.name || 'CHƯA CHỌN NỘI DUNG'}</div>

      {current ? <div className="form-athlete-photo"><AthletePhoto athlete={current} size="large" /></div> : null}
      <div className="form-athlete-info presentation-info">
        <p>🥋 <span>VĐV/Đội:</span> <strong>{current?.participantName || 'Chưa chọn lượt thi'}</strong></p>
        <p>🏫 <span>Đơn vị:</span> <strong>{current?.participantUnit || '—'}</strong></p>
        <p>👥 <span>Nhóm tuổi:</span> <strong>{current?.ageGroup || '—'}</strong></p>
          <p>⚧ <span>Giới tính:</span> <strong>{current?.gender === 'male' ? 'Nam' : current?.gender === 'female' ? 'Nữ' : current?.gender === 'other' ? 'Khác' : '—'}</strong></p>
          <p>⚖️ <span>Hạng cân:</span> <strong>{current?.weightKg ? `${current.weightKg}kg` : '—'}{current?.weightClass ? ` · ${current.weightClass}` : ''}</strong></p>
      </div>

      <div className="judge-score-row presentation-judge-row">
        {Array.from({ length: 5 }).map((_, index) => {
          const no = index + 1;
          const score = current?.scores?.[no];
          const hasScore = score !== undefined && score !== null;
          return (
            <div key={no} className={`presentation-score-box${hasScore ? ' has-score' : ''}${isFullyScored ? getScoreTone(current, score) : ''}`}>
              <span>GĐ{no}</span>
              <strong>{isFullyScored ? (score ?? '-') : (hasScore ? '✓' : '-')}</strong>
            </div>
          );
        })}
      </div>

      {!current ? (
        <div className="presentation-waiting">Chờ Tổng trọng tài Quyền chọn lượt thi</div>
      ) : !isFullyScored ? (
        <div className="presentation-waiting">
          <strong>Đang chờ đủ 5 giám định</strong>
          <span>{enteredCount}/5 giám định đã nhập điểm</span>
        </div>
      ) : null}

      <div className={`presentation-total${isFullyScored ? ' show-score' : ''}`}>
        <span>Tổng điểm</span>
        <strong>{isFullyScored ? current.finalScore : '—'}</strong>
      </div>
    </div>
  );
}
