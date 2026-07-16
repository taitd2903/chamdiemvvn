import { Card, PageHeader, StatusBadge } from '../components/Layout.jsx';
import { useGlobalState } from '../components/hooks.js';
import { resultText, statusLabel } from '../components/format.js';

export default function AdminResults() {
  const { state, error } = useGlobalState();
  const completedForms = (state?.formEntries || []).filter((entry) => entry.status === 'completed');
  const finishedMatches = (state?.fightMatches || []).filter((match) => match.status === 'finished');

  return (
    <>
      <PageHeader title="Kết quả" subtitle="Kết quả Quyền và Đối kháng đã hoàn thành." />
      {error ? <div className="alert">{error}</div> : null}
      <Card>
        <h2>Kết quả Quyền</h2>
        <table>
          <thead><tr><th>Nội dung</th><th>Người/đội</th><th>Điểm 5 giám định</th><th>Bỏ thấp/cao</th><th>Điểm cuối</th></tr></thead>
          <tbody>
            {completedForms.map((entry) => (
              <tr key={entry.id}>
                <td>{state?.contents?.find((content) => content.id === entry.contentId)?.name}</td>
                <td>{entry.participantName}</td>
                <td>{Object.entries(entry.scores).map(([judge, score]) => `GĐ${judge}: ${score}`).join(', ')}</td>
                <td>{entry.removedLow} / {entry.removedHigh}</td>
                <td><strong>{entry.finalScore}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card>
        <h2>Kết quả Đối kháng</h2>
        <table>
          <thead><tr><th>Nội dung</th><th>Trận</th><th>Điểm</th><th>Trạng thái</th><th>Kết quả</th></tr></thead>
          <tbody>
            {finishedMatches.map((match) => (
              <tr key={match.id}>
                <td>{state?.contents?.find((content) => content.id === match.contentId)?.name}</td>
                <td>{match.redName} vs {match.blueName}</td>
                <td>{match.redScore} - {match.blueScore}</td>
                <td><StatusBadge>{statusLabel(match.status)}</StatusBadge></td>
                <td><strong>{resultText(match)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
