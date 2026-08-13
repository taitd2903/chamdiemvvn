import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { socket } from '../socket.js';
import { Card, StatusBadge } from '../components/Layout.jsx';
import { SigmaMatchNode } from './SigmaPage.jsx';

const medalName = { gold: '🥇 Vàng', silver: '🥈 Bạc', bronze: '🥉 Đồng' };

export default function PublicTournamentPage({ embedded = false }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [view, setView] = useState('rankings');
  const [discipline, setDiscipline] = useState('all');
  const [selectedContentId, setSelectedContentId] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [sigmaWeight, setSigmaWeight] = useState('all');

  useEffect(() => {
    api.getPublicTournament().then(setData).catch((err) => setError(err.message));
    const update = (payload) => setData(payload);
    socket.on('public:tournament', update);
    return () => socket.off('public:tournament', update);
  }, []);

  const contentName = (id) => data?.contents?.find((row) => row.id === id)?.name || '—';
  const contents = useMemo(() => (data?.contents || []).filter((row) => discipline === 'all' || row.type === discipline), [data, discipline]);
  const selectedContent = data?.contents?.find((row) => row.id === selectedContentId);
  const contentParticipants = (data?.participants || []).filter((row) => row.contentId === selectedContentId);
  const contentMedals = (data?.medals || []).filter((row) => row.contentId === selectedContentId);
  const unitParticipants = (data?.participants || []).filter((row) => row.unit === selectedUnit);
  const unitMedals = (data?.medals || []).filter((row) => row.unit === selectedUnit);
  const unitAthletes = [...new Map(unitParticipants.map((row) => [row.athleteId, row])).values()];
  const fightingContents = (data?.contents || []).filter((row) => row.type === 'fighting');
  const weightClasses = [...new Set(fightingContents.map((row) => row.weightClass || (row.weightMin != null || row.weightMax != null ? `${row.weightMin ?? '…'}–${row.weightMax ?? '…'} kg` : 'Không phân hạng cân')))];
  const sigmaBrackets = (data?.brackets || []).filter((bracket) => {
    if (sigmaWeight === 'all') return true;
    const content = fightingContents.find((row) => row.id === bracket.contentId);
    const label = content?.weightClass || (content?.weightMin != null || content?.weightMax != null ? `${content.weightMin ?? '…'}–${content.weightMax ?? '…'} kg` : 'Không phân hạng cân');
    return label === sigmaWeight;
  });

  function openContent(id) { setSelectedContentId(id); setView('contents'); }
  function openUnit(unit) { setSelectedUnit(unit); setView('rankings'); }

  const body = <div className="public-tournament-content">
    {error ? <div className="alert">{error}</div> : null}
    <nav className="statistics-tabs">
      <button className={`btn ${view === 'rankings' ? 'btn-primary' : ''}`} onClick={() => setView('rankings')}>Toàn đoàn</button>
      <button className={`btn ${view === 'contents' ? 'btn-primary' : ''}`} onClick={() => setView('contents')}>Nội dung thi đấu</button>
      <button className={`btn ${view === 'medals' ? 'btn-primary' : ''}`} onClick={() => setView('medals')}>Huy chương</button>
      {!embedded ? <button className={`btn ${view === 'sigma' ? 'btn-primary' : ''}`} onClick={() => setView('sigma')}>Sigma đối kháng</button> : null}
    </nav>

    {view === 'rankings' ? <>
      <Card><h2>Xếp hạng toàn đoàn</h2><p className="muted">Bấm vào một đoàn để xem VĐV, nội dung tham gia và thành tích.</p><div className="table-wrap"><table className="clickable-table"><thead><tr><th>Hạng</th><th>Đơn vị</th><th>🥇 Vàng</th><th>🥈 Bạc</th><th>🥉 Đồng</th><th>Tổng</th><th>Điều kiện</th></tr></thead><tbody>
        {(data?.rankings || []).map((row) => <tr key={row.unit} className={selectedUnit === row.unit ? 'selected-row' : ''} onClick={() => openUnit(row.unit)}><td><strong>{row.rank}</strong></td><td><strong>{row.unit}</strong></td><td>{row.gold}</td><td>{row.silver}</td><td>{row.bronze}</td><td>{row.total}</td><td><StatusBadge tone={row.competedForm ? 'success' : 'neutral'}>{row.competedForm ? 'Đã thi Quyền' : 'Xếp từ hạng 4'}</StatusBadge></td></tr>)}
      </tbody></table></div></Card>
      {selectedUnit ? <Card className="statistics-detail"><div className="detail-title"><div><h2>{selectedUnit}</h2><p>{unitAthletes.length} VĐV · {unitParticipants.length} lượt đăng ký · {unitMedals.length} huy chương</p></div><button className="btn btn-small" onClick={() => setSelectedUnit('')}>Đóng</button></div>
        <div className="table-wrap"><table><thead><tr><th>VĐV</th><th>Nội dung tham gia</th><th>Thành tích</th></tr></thead><tbody>{unitAthletes.map((athlete) => {
          const entries = unitParticipants.filter((row) => row.athleteId === athlete.athleteId);
          const achievements = unitMedals.filter((row) => row.athleteId === athlete.athleteId);
          return <tr key={athlete.athleteId}><td><strong>{athlete.name}</strong></td><td>{entries.map((row) => row.contentName).join(', ')}</td><td>{achievements.length ? achievements.map((row) => `${medalName[row.type]} – ${contentName(row.contentId)}`).join(', ') : 'Chưa có huy chương'}</td></tr>;
        })}</tbody></table></div>
      </Card> : null}
    </> : null}

    {view === 'contents' ? <>
      <div className="statistics-filters"><button className={`btn ${discipline === 'all' ? 'btn-primary' : ''}`} onClick={() => setDiscipline('all')}>Tất cả</button><button className={`btn ${discipline === 'form' ? 'btn-primary' : ''}`} onClick={() => setDiscipline('form')}>Quyền</button><button className={`btn ${discipline === 'fighting' ? 'btn-primary' : ''}`} onClick={() => setDiscipline('fighting')}>Đối kháng</button></div>
      <Card><h2>Nội dung thi đấu</h2><p className="muted">Bấm vào nội dung để xem danh sách tham gia và huy chương.</p><div className="content-public-grid">{contents.map((row) => <button className={`content-stat-button ${selectedContentId === row.id ? 'active' : ''}`} key={row.id} onClick={() => openContent(row.id)}><strong>{row.name}</strong><span>{row.type === 'form' ? 'Quyền' : 'Đối kháng'}</span><small>{(data?.participants || []).filter((item) => item.contentId === row.id).length} người tham gia</small></button>)}</div></Card>
      {selectedContent ? <Card className="statistics-detail"><div className="detail-title"><div><h2>{selectedContent.name}</h2><p>{selectedContent.type === 'form' ? 'Quyền' : 'Đối kháng'} · {contentParticipants.length} người tham gia</p></div><button className="btn btn-small" onClick={() => setSelectedContentId('')}>Đóng</button></div>
        <div className="table-wrap"><table><thead><tr><th>VĐV</th><th>Đơn vị</th><th>Huy chương</th></tr></thead><tbody>{contentParticipants.map((row) => { const achievement = contentMedals.find((item) => item.athleteId === row.athleteId); return <tr key={row.athleteId}><td><strong>{row.name}</strong></td><td>{row.unit}</td><td>{achievement ? medalName[achievement.type] : 'Không có huy chương'}</td></tr>; })}</tbody></table></div>
      </Card> : null}
    </> : null}

    {view === 'medals' ? <Card><h2>Tất cả huy chương</h2><div className="table-wrap"><table><thead><tr><th>Huy chương</th><th>VĐV</th><th>Đơn vị</th><th>Nội dung</th><th>Môn</th></tr></thead><tbody>
      {(data?.medals || []).map((row, index) => <tr key={`${row.contentId}-${row.type}-${row.athleteId}-${index}`}><td><strong>{medalName[row.type]}</strong></td><td>{row.name}</td><td><button className="table-link" onClick={() => openUnit(row.unit)}>{row.unit}</button></td><td><button className="table-link" onClick={() => openContent(row.contentId)}>{contentName(row.contentId)}</button></td><td>{row.discipline === 'form' ? 'Quyền' : 'Đối kháng'}</td></tr>)}
    </tbody></table></div></Card> : null}

    {!embedded && view === 'sigma' ? <><div className="statistics-filters sigma-public-filter"><label>Hạng cân<select value={sigmaWeight} onChange={(event) => setSigmaWeight(event.target.value)}><option value="all">Tất cả hạng cân</option>{weightClasses.map((weight) => <option key={weight} value={weight}>{weight}</option>)}</select></label></div>{sigmaBrackets.map((bracket) => <section className="sigma-board public-sigma-board" key={bracket.id}>
      <header className="sigma-board-header"><div><h2>🏆 {contentName(bracket.contentId)}</h2><span>{bracket.athleteCount} VĐV · nhánh {bracket.size}</span></div><strong>Sơ đồ thi đấu</strong></header>
      <div className="sigma-bracket-scroll"><div className="sigma-bracket">
        {bracket.rounds.map((round, roundIndex) => <div className="sigma-round" key={round.index} style={{ '--round-match-count': round.matches.length }}>
          <h3>{round.name}</h3><div className="sigma-round-matches">{round.matches.map((node) => <SigmaMatchNode key={node.id} node={node} roundIndex={roundIndex} />)}</div>
        </div>)}
      </div></div>
    </section>)}{!sigmaBrackets.length ? <Card><div className="empty">Không có sơ đồ phù hợp hạng cân đã chọn.</div></Card> : null}</> : null}
  </div>;

  if (embedded) return body;
  return <div className="public-tournament-page"><header><div><h1>{data?.tournamentName || 'Giải Vovinam'}</h1><p>Kết quả và thống kê cập nhật tự động.</p></div><Link className="btn" to="/login">Đăng nhập</Link></header>{body}</div>;
}
