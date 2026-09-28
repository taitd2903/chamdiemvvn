import { useMemo, useState } from 'react';
import { api } from '../api.js';
import { Card, PageHeader, StatusBadge } from '../components/Layout.jsx';
import { useGlobalState } from '../components/hooks.js';
import { statusLabel } from '../components/format.js';
import { athleteDisplay, contentEligibilityText, deriveAgeGroup, genderLabel, getContentWeightClassOptions, getUniqueValues, matchesContentCriteria, normalizeText } from '../components/athleteMeta.js';
import { AthletePhoto } from '../components/AthletePhoto.jsx';

const blankFormEntry = { areaId: '', contentId: '', athleteId: '', orderNo: 1 };
const blankFightMatch = { areaId: '', contentId: '', redAthleteId: '', blueAthleteId: '', orderNo: 1 };
const blankEntryFilters = { keyword: '', areaId: '', contentId: '', unit: '', gender: '', ageGroup: '', weightClass: '', status: '' };
const blankFightFilters = { keyword: '', areaId: '', contentId: '', unit: '', gender: '', ageGroup: '', weightClass: '', status: '' };

export default function AdminMatches() {
  const { state, error, reload, setError } = useGlobalState();
  const [formEntry, setFormEntry] = useState(blankFormEntry);
  const [fightMatch, setFightMatch] = useState(blankFightMatch);
  const [entryFilters, setEntryFilters] = useState(blankEntryFilters);
  const [fightFilters, setFightFilters] = useState(blankFightFilters);
  const [autoForm, setAutoForm] = useState({ areaId: '', contentId: '' });

  const areas = state?.areas || [];
  const contents = state?.contents || [];
  const athletes = state?.athletes || [];
  const registrations = state?.registrations || [];
  const formEntries = state?.formEntries || [];
  const fightMatches = state?.fightMatches || [];

  const formAreas = areas.filter((area) => area.type === 'form');
  const fightAreas = areas.filter((area) => area.type === 'fighting');
  const formContents = contents.filter((content) => content.type === 'form');
  const fightContents = contents.filter((content) => content.type === 'fighting');

  const regsWithDetails = useMemo(() => registrations.map((registration) => ({
    ...registration,
    athlete: athletes.find((athlete) => athlete.id === registration.athleteId) || null,
    content: contents.find((content) => content.id === registration.contentId) || null
  })), [registrations, athletes, contents]);

  const selectedFormContent = contents.find((content) => content.id === formEntry.contentId) || null;
  const selectedFightContent = contents.find((content) => content.id === fightMatch.contentId) || null;

  const formCandidateRegs = useMemo(() => regsWithDetails.filter((registration) => {
    if (!registration.athlete || !registration.content) return false;
    if (registration.content.type !== 'form') return false;
    if (formEntry.contentId && registration.contentId !== formEntry.contentId) return false;
    return matchesContentCriteria(registration.athlete, registration.content);
  }), [regsWithDetails, formEntry.contentId]);

  const fightCandidateRegs = useMemo(() => regsWithDetails.filter((registration) => {
    if (!registration.athlete || !registration.content) return false;
    if (registration.content.type !== 'fighting') return false;
    if (fightMatch.contentId && registration.contentId !== fightMatch.contentId) return false;
    return matchesContentCriteria(registration.athlete, registration.content);
  }), [regsWithDetails, fightMatch.contentId]);

  const units = getUniqueValues(athletes, 'unit');
  const weightClasses = getContentWeightClassOptions(contents);
  const ageGroups = [...new Set(athletes.map((athlete) => athlete.ageGroup || deriveAgeGroup(athlete.birthYear)).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'));

  const filteredFormEntries = useMemo(() => {
    const keyword = normalizeText(entryFilters.keyword);
    return formEntries.filter((entry) => {
      const text = normalizeText(`${entry.participantName} ${entry.participantUnit} ${entry.ageGroup} ${entry.weightKg || ''} ${entry.weightClass} ${entry.birthYear}`);
      if (keyword && !text.includes(keyword)) return false;
      if (entryFilters.areaId && entry.areaId !== entryFilters.areaId) return false;
      if (entryFilters.contentId && entry.contentId !== entryFilters.contentId) return false;
      if (entryFilters.unit && entry.participantUnit !== entryFilters.unit) return false;
      if (entryFilters.gender && entry.gender !== entryFilters.gender) return false;
      if (entryFilters.ageGroup && (entry.ageGroup || deriveAgeGroup(entry.birthYear)) !== entryFilters.ageGroup) return false;
      if (entryFilters.weightClass && normalizeText(entry.weightClass) !== normalizeText(entryFilters.weightClass)) return false;
      if (entryFilters.status && entry.status !== entryFilters.status) return false;
      return true;
    }).sort((a, b) => a.orderNo - b.orderNo);
  }, [formEntries, entryFilters]);

  const filteredFightMatches = useMemo(() => {
    const keyword = normalizeText(fightFilters.keyword);
    return fightMatches.filter((match) => {
      const text = normalizeText(`${match.redName} ${match.blueName} ${match.redUnit} ${match.blueUnit} ${match.redAgeGroup} ${match.blueAgeGroup} ${match.redWeightClass} ${match.blueWeightClass}`);
      if (keyword && !text.includes(keyword)) return false;
      if (fightFilters.areaId && match.activeAreaId !== fightFilters.areaId && match.completedAreaId !== fightFilters.areaId) return false;
      if (fightFilters.contentId && match.contentId !== fightFilters.contentId) return false;
      if (fightFilters.unit && match.redUnit !== fightFilters.unit && match.blueUnit !== fightFilters.unit) return false;
      if (fightFilters.gender && match.redGender !== fightFilters.gender && match.blueGender !== fightFilters.gender) return false;
      if (fightFilters.ageGroup && match.redAgeGroup !== fightFilters.ageGroup && match.blueAgeGroup !== fightFilters.ageGroup) return false;
      if (fightFilters.weightClass && normalizeText(match.redWeightClass) !== normalizeText(fightFilters.weightClass) && normalizeText(match.blueWeightClass) !== normalizeText(fightFilters.weightClass)) return false;
      if (fightFilters.status && match.status !== fightFilters.status) return false;
      return true;
    }).sort((a, b) => a.orderNo - b.orderNo);
  }, [fightMatches, fightFilters]);

  async function createFormEntry(event) {
    event.preventDefault();
    try {
      await api.createFormEntry(formEntry);
      setFormEntry(blankFormEntry);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createFightMatch(event) {
    event.preventDefault();
    try {
      await api.createFightMatch(fightMatch);
      setFightMatch(blankFightMatch);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createAutomaticFormSchedule(event) {
    event.preventDefault();
    try { await api.createFormSchedule(autoForm); setAutoForm({ areaId: '', contentId: '' }); reload(); }
    catch (err) { setError(err.message); }
  }

  async function selectForm(entryId) {
    try {
      await api.selectFormEntry(entryId);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function skipForm(entryId) {
    try {
      await api.updateFormStatus(entryId, 'skipped');
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function skipFight(matchId) {
    try {
      await api.updateFightStatus(matchId, 'skipped');
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <PageHeader title="Tạo lượt thi / trận đấu" subtitle="Chỉ chọn thí sinh đã đăng ký; hệ thống tự lấy đơn vị, năm sinh, giới tính, lứa tuổi, cân nặng thực tế và hạng cân từ nội dung." />
      {error ? <div className="alert">{error}</div> : null}
      <Card><h2>Tạo lượt Quyền tự động sau khi chốt đăng ký</h2><form className="inline-form" onSubmit={createAutomaticFormSchedule}>
        <select value={autoForm.contentId} onChange={(e) => setAutoForm({ ...autoForm, contentId: e.target.value })}><option value="">Chọn nội dung Quyền</option>{formContents.filter((content) => !formEntries.some((entry) => entry.contentId === content.id)).map((content) => <option key={content.id} value={content.id}>{content.name}</option>)}</select>
        <select value={autoForm.areaId} onChange={(e) => setAutoForm({ ...autoForm, areaId: e.target.value })}><option value="">Chọn sân Quyền</option>{formAreas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select>
        <button className="btn btn-primary" disabled={!autoForm.contentId || !autoForm.areaId}>Tạo lượt tự động</button>
      </form></Card>
      <div className="two-col">
        <Card>
          <h2>Tạo lượt thi Quyền</h2>
          <form className="stack-form" onSubmit={createFormEntry}>
            <select value={formEntry.areaId} onChange={(e) => setFormEntry({ ...formEntry, areaId: e.target.value })}>
              <option value="">Chọn sân Quyền</option>
              {formAreas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
            </select>
            <select value={formEntry.contentId} onChange={(e) => setFormEntry({ ...formEntry, contentId: e.target.value, athleteId: '' })}>
              <option value="">Chọn nội dung Quyền</option>
              {formContents.map((content) => <option key={content.id} value={content.id}>{content.name}{contentEligibilityText(content) ? ` (${contentEligibilityText(content)})` : ''}</option>)}
            </select>
            <select value={formEntry.athleteId} onChange={(e) => setFormEntry({ ...formEntry, athleteId: e.target.value })} disabled={!formEntry.contentId}>
              <option value="">{formEntry.contentId ? 'Chọn thí sinh/đội đã đăng ký' : 'Chọn nội dung trước'}</option>
              {formCandidateRegs.map((registration) => <option key={registration.id} value={registration.athleteId}>{athleteDisplay(registration.athlete)}</option>)}
            </select>
            <input type="number" min="1" placeholder="Thứ tự lượt" value={formEntry.orderNo} onChange={(e) => setFormEntry({ ...formEntry, orderNo: Number(e.target.value) })} />
            {athletes.find((row) => row.id === formEntry.athleteId) ? <div className="athlete-with-photo"><AthletePhoto athlete={athletes.find((row) => row.id === formEntry.athleteId)} /><strong>{athletes.find((row) => row.id === formEntry.athleteId)?.name}</strong></div> : null}
            {selectedFormContent ? <p className="muted">Tiêu chí: {contentEligibilityText(selectedFormContent) || 'Không giới hạn'}</p> : null}
            <button className="btn btn-primary" disabled={!formEntry.areaId || !formEntry.contentId || !formEntry.athleteId}>Tạo lượt</button>
          </form>
        </Card>
        <Card>
          <h2>Tạo trận Đối kháng</h2>
          <form className="stack-form" onSubmit={createFightMatch}>
            <select value={fightMatch.contentId} onChange={(e) => setFightMatch({ ...fightMatch, contentId: e.target.value, redAthleteId: '', blueAthleteId: '' })}>
              <option value="">Chọn nội dung Đối kháng</option>
              {fightContents.map((content) => <option key={content.id} value={content.id}>{content.name}{contentEligibilityText(content) ? ` (${contentEligibilityText(content)})` : ''}</option>)}
            </select>
            <select value={fightMatch.redAthleteId} onChange={(e) => setFightMatch({ ...fightMatch, redAthleteId: e.target.value })} disabled={!fightMatch.contentId}>
              <option value="">Võ sĩ Đỏ</option>
              {fightCandidateRegs.map((registration) => <option key={registration.id} value={registration.athleteId} disabled={registration.athleteId === fightMatch.blueAthleteId}>{athleteDisplay(registration.athlete)}</option>)}
            </select>
            <select value={fightMatch.blueAthleteId} onChange={(e) => setFightMatch({ ...fightMatch, blueAthleteId: e.target.value })} disabled={!fightMatch.contentId}>
              <option value="">Võ sĩ Xanh</option>
              {fightCandidateRegs.map((registration) => <option key={registration.id} value={registration.athleteId} disabled={registration.athleteId === fightMatch.redAthleteId}>{athleteDisplay(registration.athlete)}</option>)}
            </select>
            <input type="number" min="1" placeholder="Thứ tự trận" value={fightMatch.orderNo} onChange={(e) => setFightMatch({ ...fightMatch, orderNo: Number(e.target.value) })} />
            <div className="athlete-with-photo">{[fightMatch.redAthleteId, fightMatch.blueAthleteId].map((id) => athletes.find((row) => row.id === id)).filter(Boolean).map((athlete) => <span className="athlete-with-photo" key={athlete.id}><AthletePhoto athlete={athlete} size="small" /><strong>{athlete.name}</strong></span>)}</div>
            <p className="muted">Trận không gắn cố định với sân. Tổng trọng tài của bất kỳ sân Đối kháng nào cũng có thể nhận trận từ danh sách chung.</p>
            {selectedFightContent ? <p className="muted">Tiêu chí: {contentEligibilityText(selectedFightContent) || 'Không giới hạn'}</p> : null}
            <button className="btn btn-primary" disabled={!fightMatch.contentId || !fightMatch.redAthleteId || !fightMatch.blueAthleteId}>Tạo trận</button>
          </form>
        </Card>
      </div>
      <Card>
        <h2>Bộ lọc lượt Quyền</h2>
        <div className="filter-grid">
          <input placeholder="Tìm người/đội, đơn vị, cân nặng, hạng cân..." value={entryFilters.keyword} onChange={(e) => setEntryFilters({ ...entryFilters, keyword: e.target.value })} />
          <select value={entryFilters.areaId} onChange={(e) => setEntryFilters({ ...entryFilters, areaId: e.target.value })}><option value="">Tất cả sân</option>{formAreas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select>
          <select value={entryFilters.contentId} onChange={(e) => setEntryFilters({ ...entryFilters, contentId: e.target.value })}><option value="">Tất cả nội dung</option>{formContents.map((content) => <option key={content.id} value={content.id}>{content.name}</option>)}</select>
          <select value={entryFilters.unit} onChange={(e) => setEntryFilters({ ...entryFilters, unit: e.target.value })}><option value="">Tất cả đơn vị</option>{units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select>
          <select value={entryFilters.gender} onChange={(e) => setEntryFilters({ ...entryFilters, gender: e.target.value })}><option value="">Tất cả giới tính</option><option value="male">Nam</option><option value="female">Nữ</option><option value="other">Khác</option></select>
          <select value={entryFilters.ageGroup} onChange={(e) => setEntryFilters({ ...entryFilters, ageGroup: e.target.value })}><option value="">Tất cả lứa tuổi</option>{ageGroups.map((ageGroup) => <option key={ageGroup} value={ageGroup}>{ageGroup}</option>)}</select>
          <select value={entryFilters.weightClass} onChange={(e) => setEntryFilters({ ...entryFilters, weightClass: e.target.value })}><option value="">Tất cả hạng cân nội dung</option>{weightClasses.map((weightClass) => <option key={weightClass} value={weightClass}>{weightClass}</option>)}</select>
          <select value={entryFilters.status} onChange={(e) => setEntryFilters({ ...entryFilters, status: e.target.value })}><option value="">Tất cả trạng thái</option><option value="pending">Chưa thi</option><option value="running">Đang thi</option><option value="skipped">Tạm bỏ qua</option><option value="completed">Đã chấm xong</option><option value="cancelled">Hủy</option></select>
          <button className="btn" type="button" onClick={() => setEntryFilters(blankEntryFilters)}>Xóa lọc</button>
        </div>
      </Card>
      <Card>
        <h2>Danh sách lượt Quyền</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Ảnh</th><th>Thứ tự</th><th>Sân</th><th>Nội dung</th><th>Người/đội</th><th>Đơn vị</th><th>Giới tính</th><th>Năm sinh / Lứa tuổi</th><th>Cân nặng / Hạng cân</th><th>Trạng thái</th><th>Điểm cuối</th><th></th></tr></thead>
            <tbody>
              {filteredFormEntries.map((entry) => (
                <tr key={entry.id}>
                  <td><AthletePhoto athlete={entry} size="small" /></td>
                  <td>{entry.orderNo}</td>
                  <td>{areas.find((a) => a.id === entry.areaId)?.name}</td>
                  <td>{contents.find((c) => c.id === entry.contentId)?.name}</td>
                  <td>{entry.participantName}</td>
                  <td>{entry.participantUnit || '-'}</td>
                  <td>{genderLabel(entry.gender)}</td>
                  <td>{entry.ageGroup || deriveAgeGroup(entry.birthYear) || '-'}{entry.birthYear ? <div className="muted">NS {entry.birthYear}</div> : null}</td>
                  <td>{entry.weightKg ? `${entry.weightKg}kg thực tế` : '-'}{entry.weightClass ? <div className="muted">Hạng {entry.weightClass}</div> : null}</td>
                  <td><StatusBadge>{statusLabel(entry.status)}</StatusBadge></td>
                  <td>{entry.finalScore ?? '-'}</td>
                  <td className="row-actions"><button className="btn" onClick={() => selectForm(entry.id)}>Chọn thi</button><button className="btn" onClick={() => skipForm(entry.id)}>Tạm bỏ qua</button></td>
                </tr>
              ))}
              {filteredFormEntries.length === 0 ? <tr><td colSpan="12" className="empty">Không có lượt Quyền phù hợp bộ lọc.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <h2>Bộ lọc trận Đối kháng</h2>
        <div className="filter-grid">
          <input placeholder="Tìm võ sĩ, đơn vị, cân nặng, hạng cân..." value={fightFilters.keyword} onChange={(e) => setFightFilters({ ...fightFilters, keyword: e.target.value })} />
          <select value={fightFilters.areaId} onChange={(e) => setFightFilters({ ...fightFilters, areaId: e.target.value })}><option value="">Tất cả sân</option>{fightAreas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select>
          <select value={fightFilters.contentId} onChange={(e) => setFightFilters({ ...fightFilters, contentId: e.target.value })}><option value="">Tất cả nội dung</option>{fightContents.map((content) => <option key={content.id} value={content.id}>{content.name}</option>)}</select>
          <select value={fightFilters.unit} onChange={(e) => setFightFilters({ ...fightFilters, unit: e.target.value })}><option value="">Tất cả đơn vị</option>{units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select>
          <select value={fightFilters.gender} onChange={(e) => setFightFilters({ ...fightFilters, gender: e.target.value })}><option value="">Tất cả giới tính</option><option value="male">Nam</option><option value="female">Nữ</option><option value="other">Khác</option></select>
          <select value={fightFilters.ageGroup} onChange={(e) => setFightFilters({ ...fightFilters, ageGroup: e.target.value })}><option value="">Tất cả lứa tuổi</option>{ageGroups.map((ageGroup) => <option key={ageGroup} value={ageGroup}>{ageGroup}</option>)}</select>
          <select value={fightFilters.weightClass} onChange={(e) => setFightFilters({ ...fightFilters, weightClass: e.target.value })}><option value="">Tất cả hạng cân nội dung</option>{weightClasses.map((weightClass) => <option key={weightClass} value={weightClass}>{weightClass}</option>)}</select>
          <select value={fightFilters.status} onChange={(e) => setFightFilters({ ...fightFilters, status: e.target.value })}><option value="">Tất cả trạng thái</option><option value="pending">Chưa đấu</option><option value="running">Đang đấu</option><option value="paused">Tạm dừng</option><option value="break">Nghỉ giữa hiệp</option><option value="golden">Điểm vàng</option><option value="skipped">Tạm bỏ qua</option><option value="finished">Đã kết thúc</option><option value="cancelled">Hủy</option></select>
          <button className="btn" type="button" onClick={() => setFightFilters(blankFightFilters)}>Xóa lọc</button>
        </div>
      </Card>
      <Card>
        <h2>Danh sách trận Đối kháng</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Thứ tự</th><th>Sân</th><th>Nội dung</th><th>Đỏ</th><th>Xanh</th><th>Thông tin hạng mục</th><th>Giờ/hiệp</th><th>Nghỉ</th><th>Tỉ số</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              {filteredFightMatches.map((match) => (
                <tr key={match.id}>
                  <td>{match.orderNo}</td>
                  <td>{areas.find((a) => a.id === (match.activeAreaId || match.completedAreaId))?.name || 'Chưa nhận sân'}</td>
                  <td>{contents.find((c) => c.id === match.contentId)?.name}</td>
                  <td><strong className="red-text">{match.redName}</strong><div className="muted">{match.redUnit || '-'} · {genderLabel(match.redGender)} · {match.redAgeGroup || deriveAgeGroup(match.redBirthYear) || '-'} · {match.redWeightKg ? `${match.redWeightKg}kg thực tế` : '-'} {match.redWeightClass ? `· Hạng ${match.redWeightClass}` : ''}</div></td>
                  <td><strong className="blue-text">{match.blueName}</strong><div className="muted">{match.blueUnit || '-'} · {genderLabel(match.blueGender)} · {match.blueAgeGroup || deriveAgeGroup(match.blueBirthYear) || '-'} · {match.blueWeightKg ? `${match.blueWeightKg}kg thực tế` : '-'} {match.blueWeightClass ? `· Hạng ${match.blueWeightClass}` : ''}</div></td>
                  <td>{contentEligibilityText(contents.find((c) => c.id === match.contentId)) || '-'}</td>
                  <td>{match.roundSeconds}s</td>
                  <td>{match.breakSeconds}s</td>
                  <td>{match.redScore} - {match.blueScore}</td>
                  <td><StatusBadge>{statusLabel(match.status)}</StatusBadge></td>
                  <td><button className="btn" onClick={() => skipFight(match.id)}>Tạm bỏ qua</button></td>
                </tr>
              ))}
              {filteredFightMatches.length === 0 ? <tr><td colSpan="11" className="empty">Không có trận Đối kháng phù hợp bộ lọc.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
