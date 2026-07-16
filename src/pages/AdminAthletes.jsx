import { useMemo, useState } from 'react';
import { api } from '../api.js';
import { Card, PageHeader } from '../components/Layout.jsx';
import { useGlobalState } from '../components/hooks.js';
import {
  athleteMatchesWeightClass,
  deriveAgeGroup,
  eligibleWeightClassLabels,
  formatAgeInfo,
  formatWeightInfo,
  genderLabel,
  getContentWeightClassOptions,
  getUniqueValues,
  normalizeText
} from '../components/athleteMeta.js';

const blankForm = { name: '', unit: '', birthYear: '', gender: '', weightKg: '' };
const blankFilters = { keyword: '', unit: '', gender: '', ageGroup: '', weightClass: '', birthYear: '' };

export default function AdminAthletes() {
  const { state, error, reload, setError } = useGlobalState();
  const [form, setForm] = useState(blankForm);
  const [filters, setFilters] = useState(blankFilters);

  const athletes = state?.athletes || [];
  const contents = state?.contents || [];
  const units = getUniqueValues(athletes, 'unit');
  const weightClasses = getContentWeightClassOptions(contents);
  const ageGroups = [...new Set(athletes.map((athlete) => athlete.ageGroup || deriveAgeGroup(athlete.birthYear)).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'));

  const filteredAthletes = useMemo(() => {
    const keyword = normalizeText(filters.keyword);
    return athletes.filter((athlete) => {
      const ageGroup = athlete.ageGroup || deriveAgeGroup(athlete.birthYear);
      const eligibleWeights = eligibleWeightClassLabels(athlete, contents).join(' ');
      if (keyword) {
        const text = normalizeText(`${athlete.name} ${athlete.unit} ${athlete.weightKg || ''} ${eligibleWeights} ${ageGroup} ${athlete.birthYear}`);
        if (!text.includes(keyword)) return false;
      }
      if (filters.unit && athlete.unit !== filters.unit) return false;
      if (filters.gender && athlete.gender !== filters.gender) return false;
      if (filters.ageGroup && ageGroup !== filters.ageGroup) return false;
      if (filters.weightClass && !athleteMatchesWeightClass(athlete, filters.weightClass, contents)) return false;
      if (filters.birthYear && Number(athlete.birthYear) !== Number(filters.birthYear)) return false;
      return true;
    });
  }, [athletes, contents, filters]);

  async function submit(event) {
    event.preventDefault();
    try {
      await api.createAthlete({
        ...form,
        birthYear: form.birthYear ? Number(form.birthYear) : null,
        weightKg: form.weightKg ? Number(form.weightKg) : null,
        weightClass: '',
        ageGroup: deriveAgeGroup(form.birthYear)
      });
      setForm(blankForm);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    try {
      await api.deleteAthlete(id);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <PageHeader title="Quản lý thí sinh / đội" subtitle="Thí sinh chỉ nhập cân nặng thực tế. Hạng cân được hệ thống tự đối chiếu từ các nội dung đã tạo khi đăng ký." />
      {error ? <div className="alert">{error}</div> : null}
      <Card>
        <h2>Thêm thí sinh / đội</h2>
        <form className="stack-form" onSubmit={submit}>
          <div className="form-grid-3">
            <input placeholder="Họ tên / tên đội" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Đơn vị / CLB" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Chọn giới tính</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
            <input type="number" placeholder="Năm sinh" value={form.birthYear} onChange={(e) => setForm({ ...form, birthYear: e.target.value })} />
            <input type="number" step="0.1" placeholder="Cân nặng thực tế (kg)" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} />
          </div>
          <div className="derived-preview">
            <strong>Lứa tuổi tự quy đổi:</strong> {deriveAgeGroup(form.birthYear) || 'Nhập năm sinh để tự quy đổi'}
          </div>
          <div className="derived-preview">
            <strong>Hạng cân:</strong> Không nhập tay ở thí sinh. Khi đăng ký nội dung, hệ thống sẽ tự lọc theo cân nặng thực tế và hạng cân của nội dung.
          </div>
          <button className="btn btn-primary">Thêm</button>
        </form>
      </Card>
      <Card>
        <h2>Bộ lọc thí sinh</h2>
        <div className="filter-grid">
          <input placeholder="Tìm tên, đơn vị, cân nặng, hạng phù hợp..." value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} />
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
            <option value="">Tất cả hạng cân phù hợp</option>
            {weightClasses.map((weightClass) => <option key={weightClass} value={weightClass}>{weightClass}</option>)}
          </select>
          <input type="number" placeholder="Lọc năm sinh" value={filters.birthYear} onChange={(e) => setFilters({ ...filters, birthYear: e.target.value })} />
          <button className="btn" type="button" onClick={() => setFilters(blankFilters)}>Xóa lọc</button>
        </div>
      </Card>
      <Card>
        <h2>Danh sách thí sinh / đội</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Tên</th><th>Đơn vị</th><th>Giới tính</th><th>Năm sinh / Lứa tuổi</th><th>Cân nặng thực tế</th><th>Hạng cân phù hợp từ nội dung</th><th></th></tr></thead>
            <tbody>
              {filteredAthletes.map((athlete) => {
                const eligibleWeights = eligibleWeightClassLabels(athlete, contents);
                return (
                  <tr key={athlete.id}>
                    <td>{athlete.name}</td>
                    <td>{athlete.unit || '-'}</td>
                    <td>{genderLabel(athlete.gender)}</td>
                    <td>{formatAgeInfo(athlete)}</td>
                    <td>{formatWeightInfo(athlete)}</td>
                    <td>{eligibleWeights.length ? eligibleWeights.join(', ') : '—'}</td>
                    <td><button className="btn btn-danger" onClick={() => remove(athlete.id)}>Xóa</button></td>
                  </tr>
                );
              })}
              {filteredAthletes.length === 0 ? <tr><td colSpan="7" className="empty">Không có thí sinh phù hợp bộ lọc.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
