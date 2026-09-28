import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { Card, PageHeader } from '../components/Layout.jsx';
import { useGlobalState } from '../components/hooks.js';
import { typeLabel } from '../components/format.js';
import { athleteDisplay, contentEligibilityText, contentWeightClassLabel, deriveAgeGroup, formatAgeInfo, formatRegistrationWeightInfo, genderLabel, getContentWeightClassOptions, getUniqueValues, matchesContentCriteria, normalizeText } from '../components/athleteMeta.js';
import { useAuth } from '../auth.jsx';
import { AthletePhoto } from '../components/AthletePhoto.jsx';

const blankFilters = { keyword: '', contentId: '', unit: '', gender: '', ageGroup: '', weightClass: '', birthYear: '' };

export default function AdminRegistrations() {
  const { user } = useAuth();
  const { state, error, reload, setError } = useGlobalState();
  const [registrations, setRegistrations] = useState([]);
  const [form, setForm] = useState({ athleteId: '', contentId: '' });
  const [filters, setFilters] = useState(blankFilters);
  const [locked, setLocked] = useState(false);

  async function loadRegs() {
    const rows = await api.getRegistrations();
    setRegistrations(rows);
  }

  useEffect(() => {
    loadRegs().catch((err) => setError(err.message));
    api.getRegistrationStatus().then((data) => setLocked(data.locked)).catch((err) => setError(err.message));
  }, []);

  async function lockRegistrations() {
    if (!window.confirm('Chốt toàn bộ đăng ký? Sau bước này không thể thêm, xóa hay đổi đăng ký.')) return;
    try { await api.lockRegistrations(); setLocked(true); } catch (err) { setError(err.message); }
  }

  async function unlockRegistrations() {
    if (!window.confirm('Mở lại đăng ký để bổ sung hoặc chỉnh sửa danh sách?')) return;
    try { await api.unlockRegistrations(); setLocked(false); } catch (err) { setError(err.message); }
  }

  const athletes = state?.athletes || [];
  const contents = state?.contents || [];
  const selectedContent = contents.find((content) => content.id === form.contentId) || null;
  const selectedAthlete = athletes.find((athlete) => athlete.id === form.athleteId) || null;
  const filterContent = contents.find((content) => content.id === filters.contentId) || null;
  const units = getUniqueValues(athletes, 'unit');
  const weightClasses = getContentWeightClassOptions(contents);
  const ageGroups = [...new Set(athletes.map((athlete) => athlete.ageGroup || deriveAgeGroup(athlete.birthYear)).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'));

  const registrationKeySet = useMemo(() => new Set(registrations.map((row) => `${row.athleteId}:${row.contentId}`)), [registrations]);

  const athleteOptions = useMemo(() => {
    return athletes.filter((athlete) => {
      if (!selectedContent) return true;
      if (registrationKeySet.has(`${athlete.id}:${selectedContent.id}`)) return false;
      return matchesContentCriteria(athlete, selectedContent);
    });
  }, [athletes, selectedContent, registrationKeySet]);

  const filteredRegistrations = useMemo(() => {
    const keyword = normalizeText(filters.keyword);
    return registrations.filter((row) => {
      const athlete = row.athlete;
      const content = row.content;
      const ageGroup = athlete?.ageGroup || deriveAgeGroup(athlete?.birthYear);
      if (keyword) {
        const text = normalizeText(`${athlete?.name} ${athlete?.unit} ${athlete?.weightKg || ''} ${contentWeightClassLabel(content)} ${ageGroup} ${content?.name}`);
        if (!text.includes(keyword)) return false;
      }
      if (filters.contentId && row.contentId !== filters.contentId) return false;
      if (filterContent && athlete && !matchesContentCriteria(athlete, filterContent)) return false;
      if (filters.unit && athlete?.unit !== filters.unit) return false;
      if (filters.gender && athlete?.gender !== filters.gender) return false;
      if (filters.ageGroup && ageGroup !== filters.ageGroup) return false;
      if (filters.weightClass && normalizeText(contentWeightClassLabel(content)) !== normalizeText(filters.weightClass)) return false;
      if (filters.birthYear && Number(athlete?.birthYear) !== Number(filters.birthYear)) return false;
      return true;
    });
  }, [registrations, filters, filterContent]);

  async function submit(event) {
    event.preventDefault();
    try {
      await api.createRegistration(form);
      setForm({ athleteId: '', contentId: '' });
      await loadRegs();
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    try {
      await api.deleteRegistration(id);
      await loadRegs();
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <PageHeader title="Đăng ký nội dung thi" subtitle="Tạo thí sinh chưa phải là đăng ký. Cần chọn nội dung và gắn từng thí sinh vào nội dung trước khi chốt." actions={user.role === 'admin' ? (locked ? <button className="btn" onClick={unlockRegistrations}>Mở lại đăng ký</button> : <button className="btn btn-primary" onClick={lockRegistrations}>Chốt đăng ký</button>) : null} />
      {error ? <div className="alert">{error}</div> : null}
      {locked ? <div className="alert registration-locked-banner">Đăng ký đã được Admin chốt. Danh sách hiện chỉ được xem.</div> : null}
      <Card>
        <h2>Đăng ký thí sinh vào nội dung</h2>
        <form className="stack-form" onSubmit={submit}>
          <div className="form-grid-3">
            <select value={form.contentId} onChange={(e) => setForm({ athleteId: '', contentId: e.target.value })}>
              <option value="">Chọn nội dung</option>
              {contents.map((content) => <option key={content.id} value={content.id}>{content.name} - {typeLabel(content.type)}{contentEligibilityText(content) ? ` (${contentEligibilityText(content)})` : ''}</option>)}
            </select>
            <select value={form.athleteId} onChange={(e) => setForm({ ...form, athleteId: e.target.value })} disabled={!form.contentId}>
              <option value="">{form.contentId ? 'Chọn thí sinh phù hợp' : 'Chọn nội dung trước'}</option>
              {athleteOptions.map((athlete) => <option key={athlete.id} value={athlete.id}>{athleteDisplay(athlete)}</option>)}
            </select>
            <button className="btn btn-primary" disabled={locked || !form.contentId || !form.athleteId}>Đăng ký</button>
          </div>
          {selectedContent ? <p className="muted">Tiêu chí nội dung: {contentEligibilityText(selectedContent) || 'Không giới hạn'}. Danh sách thí sinh đã được lọc và loại người đã đăng ký nội dung này.</p> : null}
          {selectedAthlete ? <div className="athlete-with-photo"><AthletePhoto athlete={selectedAthlete} /><strong>{selectedAthlete.name}</strong><span>{selectedAthlete.unit}</span></div> : null}
          {selectedContent ? <p className="muted"><strong>Giới hạn toàn đoàn:</strong> {selectedContent.type === 'form' ? (state?.settings?.formContentLimitPerUnit ? `tối đa ${state.settings.formContentLimitPerUnit} nội dung Quyền/đoàn` : 'không giới hạn nội dung Quyền') : (state?.settings?.fightingContentLimitPerUnit ? `tối đa ${state.settings.fightingContentLimitPerUnit} nội dung Đối kháng/đoàn` : 'không giới hạn nội dung Đối kháng')}{selectedAthlete ? ` · Đang đăng ký cho ${selectedAthlete.unit || 'đơn vị chưa đặt tên'}` : ''}.</p> : null}
        </form>
      </Card>
      <Card>
        <h2>Bộ lọc đăng ký</h2>
        <div className="filter-grid">
          <input placeholder="Tìm thí sinh, đơn vị, nội dung, hạng cân..." value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} />
          <select value={filters.contentId} onChange={(e) => setFilters({ ...filters, contentId: e.target.value })}>
            <option value="">Tất cả nội dung</option>
            {contents.map((content) => <option key={content.id} value={content.id}>{content.name} - {typeLabel(content.type)}</option>)}
          </select>
          <select value={filters.unit} onChange={(e) => setFilters({ ...filters, unit: e.target.value })}>
            <option value="">Tất cả đơn vị</option>
            {units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
          </select>
          <select value={filters.gender} onChange={(e) => setFilters({ ...filters, gender: e.target.value })}>
            <option value="">Tất cả giới tính</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </select>
          <select value={filters.ageGroup} onChange={(e) => setFilters({ ...filters, ageGroup: e.target.value })}>
            <option value="">Tất cả lứa tuổi</option>
            {ageGroups.map((ageGroup) => <option key={ageGroup} value={ageGroup}>{ageGroup}</option>)}
          </select>
          <select value={filters.weightClass} onChange={(e) => setFilters({ ...filters, weightClass: e.target.value })}>
            <option value="">Tất cả hạng cân nội dung</option>
            {weightClasses.map((weightClass) => <option key={weightClass} value={weightClass}>{weightClass}</option>)}
          </select>
          <input type="number" placeholder="Lọc năm sinh" value={filters.birthYear} onChange={(e) => setFilters({ ...filters, birthYear: e.target.value })} />
          <button className="btn" type="button" onClick={() => setFilters(blankFilters)}>Xóa lọc</button>
        </div>
      </Card>
      <Card>
        <h2>Danh sách đăng ký</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Ảnh</th><th>Thí sinh</th><th>Đơn vị</th><th>Giới tính</th><th>Năm sinh / Lứa tuổi</th><th>Cân nặng / Hạng cân</th><th>Nội dung</th><th>Loại</th><th></th></tr></thead>
            <tbody>
              {filteredRegistrations.map((row) => (
                <tr key={row.id}>
                  <td><AthletePhoto athlete={row.athlete} size="small" /></td>
                  <td>{row.athlete?.name}</td>
                  <td>{row.athlete?.unit || '-'}</td>
                  <td>{genderLabel(row.athlete?.gender)}</td>
                  <td>{formatAgeInfo(row.athlete)}</td>
                  <td>{formatRegistrationWeightInfo(row.athlete, row.content)}</td>
                  <td>{row.content?.name}</td>
                  <td>{typeLabel(row.content?.type)}</td>
                  <td>{!locked ? <button className="btn btn-danger" onClick={() => remove(row.id)}>Xóa</button> : 'Đã chốt'}</td>
                </tr>
              ))}
              {filteredRegistrations.length === 0 ? <tr><td colSpan="9" className="empty">Không có đăng ký phù hợp bộ lọc.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
