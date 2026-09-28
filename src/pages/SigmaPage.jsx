import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Card, PageHeader } from '../components/Layout.jsx';
import { useGlobalState } from '../components/hooks.js';

export function SigmaPlayer({ player, winner, loser, side }) {
  const disqualified = Boolean(player?.disqualifiedReason);
  return <div className={`sigma-player sigma-${side} ${winner ? 'sigma-player-winner' : ''} ${loser || disqualified ? 'sigma-player-loser' : ''} ${!player ? 'sigma-player-empty' : ''}`}>
    <span className="sigma-armor-label">{side === 'red' ? 'GIÁP ĐỎ' : 'GIÁP XANH'}</span>
    <strong>{player?.name || 'Chờ kết quả'}</strong>
    <small>{player?.unit || '—'}</small>
    {disqualified ? <em className="sigma-disqualified">{player.disqualifiedReason}</em> : null}
  </div>;
}

export function SigmaMatchNode({ node, roundIndex }) {
  return <div className="sigma-match-node">
    <SigmaPlayer player={node.red} winner={node.winner?.athleteId === node.red?.athleteId} loser={Boolean(node.winner && node.red && node.winner.athleteId !== node.red.athleteId)} side="red" />
    <span className="sigma-match-label">{node.resolvedByWeight ? 'Loại cân' : roundIndex === 0 && node.winner && (!node.red || !node.blue) ? 'Miễn đấu' : `Trận ${node.matchNo}`}</span>
    <SigmaPlayer player={node.blue} winner={node.winner?.athleteId === node.blue?.athleteId} loser={Boolean(node.winner && node.blue && node.winner.athleteId !== node.blue.athleteId)} side="blue" />
  </div>;
}

export default function SigmaPage() {
  const { user } = useAuth();
  const { state } = useGlobalState();
  const [brackets, setBrackets] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [draw, setDraw] = useState({ contentId: '' });
  const [error, setError] = useState('');
  const contents = state?.contents?.filter((row) => row.type === 'fighting') || [];
  const load = () => api.getBrackets().then((rows) => { setBrackets(rows); setSelectedId((current) => current || rows[0]?.id || ''); }).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);
  const bracket = useMemo(() => brackets.find((row) => row.id === selectedId) || null, [brackets, selectedId]);
  const content = contents.find((row) => row.id === bracket?.contentId);

  async function submit(event) {
    event.preventDefault(); setError('');
    try { const created = await api.drawFighting(draw); await load(); setSelectedId(created.id); }
    catch (err) { setError(err.message); }
  }

  return <>
    <PageHeader title="Sigma - Sơ đồ Đối kháng" subtitle="Nhánh đấu chỉ được xáo ngẫu nhiên khi Admin bấm Bốc thăm và được lưu cố định sau đó." />
    {error ? <div className="alert">{error}</div> : null}
    {user.role === 'admin' ? <Card className="sigma-draw-card"><h2>Bốc thăm nội dung</h2><form className="inline-form" onSubmit={submit}>
      <select value={draw.contentId} onChange={(e) => setDraw({ ...draw, contentId: e.target.value })}><option value="">Chọn nội dung Đối kháng</option>{contents.filter((row) => !brackets.some((bracketRow) => bracketRow.contentId === row.id)).map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select>
      <button className="btn btn-primary" disabled={!draw.contentId}>Bốc thăm</button>
    </form></Card> : null}
    <Card className="sigma-selector-card"><select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}><option value="">Chọn sơ đồ đã bốc thăm</option>{brackets.map((row) => <option key={row.id} value={row.id}>{contents.find((item) => item.id === row.contentId)?.name || row.contentId}</option>)}</select></Card>
    {bracket ? <section className="sigma-board">
      <header className="sigma-board-header"><div><h2>🏆 {content?.name || 'Nội dung Đối kháng'}</h2><span>{bracket.athleteCount} VĐV · nhánh {bracket.size} · không cố định sân</span></div><strong>Đã bốc thăm</strong></header>
      <div className="sigma-bracket-scroll"><div className="sigma-bracket">
        {bracket.rounds.map((round, roundIndex) => <div className="sigma-round" key={round.index} style={{ '--round-match-count': round.matches.length }}>
          <h3>{round.name}</h3><div className="sigma-round-matches">{round.matches.map((node) => <SigmaMatchNode key={node.id} node={node} roundIndex={roundIndex} />)}</div>
        </div>)}
      </div></div>
    </section> : <Card><div className="empty">Chưa có nội dung nào được Admin bốc thăm.</div></Card>}
  </>;
}
