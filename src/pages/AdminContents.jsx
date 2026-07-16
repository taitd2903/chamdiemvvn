import { useMemo, useState } from 'react';
import { api } from '../api.js';
import { Card, PageHeader } from '../components/Layout.jsx';
import { useGlobalState } from '../components/hooks.js';
import { typeLabel } from '../components/format.js';
import {
  contentEligibilityText,
  contentWeightClassLabel,
  deriveContentAgeGroup,
  genderLabel,
  getContentWeightClassOptions,
  normalizeText
} from '../components/athleteMeta.js';

const CONTENT_TYPES = {
  FORM: 'form',
  FIGHTING: 'fighting'
};

const blankForm = {
  step: 1,
  type: '',
  name: '',
  mode: 'individual',
  formSize: '1',
  memberCount: 1,
  memberCountMax: null,
  ageGroupScope: 'all',
  gender: '',
  ageGroup: '',
  birthYearFrom: '',
  birthYearTo: '',
  weightMin: '',
  weightMax: '',
  weightClass: ''
};

const blankFilters = { keyword: '', type: '', gender: '', ageGroup: '', weightClass: '' };

const ageGroupOptions = ['Nhi đồng', 'Lứa tuổi 1', 'Lứa tuổi 2', 'Lứa tuổi 3', 'Thanh niên'];

function buildFormSizeMeta(formSize) {
  if (formSize === '4') return { mode: 'team', memberCount: 4, memberCountMax: 4 };
  if (formSize === '6-10') return { mode: 'team', memberCount: 6, memberCountMax: 10 };
  return { mode: 'individual', memberCount: 1, memberCountMax: 1 };
}

function formSizeLabel(content) {
  if (content.formSize === '6-10') return '6-10 người';
  if (content.formSize === '4') return '4 người';
  if (content.formSize === '1') return '1 người';
  if (content.memberCountMax && content.memberCountMax !== content.memberCount) return `${content.memberCount}-${content.memberCountMax} người`;
  return `${content.memberCount || 1} người`;
}

function buildFightName(form) {
  const gender = form.gender === 'male' ? 'Nam' : form.gender === 'female' ? 'Nữ' : '';
  const age = form.ageGroup || 'Lứa tuổi';
  const min = form.weightMin || '...';
  const max = form.weightMax || '...';
  return `${gender} ${age} ${min}-${max}kg`.trim();
}

export default function AdminContents() {
  const { state, error, reload, setError } = useGlobalState();
  const [form, setForm] = useState(blankForm);
  const [filters, setFilters] = useState(blankFilters);
  const contents = state?.contents || [];

  const filteredContents = useMemo(() => {
    const keyword = normalizeText(filters.keyword);
    return contents.filter((content) => {
      const text = normalizeText(`${content.name} ${content.weightClass} ${content.ageGroup} ${formSizeLabel(content)} ${contentEligibilityText(content)}`);
      if (keyword && !text.includes(keyword)) return false;
      if (filters.type && content.type !== filters.type) return false;
      if (filters.gender && content.gender !== filters.gender) return false;
      if (filters.ageGroup && deriveContentAgeGroup(content) !== filters.ageGroup) return false;
      if (filters.weightClass && normalizeText(contentWeightClassLabel(content)) !== normalizeText(filters.weightClass)) return false;
      return true;
    });
  }, [contents, filters]);

  const ageGroups = [...new Set(contents.map((content) => deriveContentAgeGroup(content)).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'));
  const weightClasses = getContentWeightClassOptions(contents);
  const isFormType = form.type === CONTENT_TYPES.FORM;
  const isFightingType = form.type === CONTENT_TYPES.FIGHTING;

  function chooseType(type) {
    setForm({
      ...blankForm,
      step: 2,
      type,
      ...(type === CONTENT_TYPES.FIGHTING
        ? { mode: 'individual', formSize: '1', gender: 'male', ageGroupScope: 'specific' }
        : { mode: 'individual', formSize: '1', gender: '', ageGroupScope: 'all' })
    });
  }

  function updateFormSize(formSize) {
    const sizeMeta = buildFormSizeMeta(formSize);
    setForm({ ...form, formSize, ...sizeMeta });
  }

  async function submit(event) {
    event.preventDefault();
    try {
      const sizeMeta = isFormType ? buildFormSizeMeta(form.formSize) : { mode: 'individual', memberCount: 1, memberCountMax: 1 };
      const fightingWeightClass = isFightingType && form.weightMin && form.weightMax ? `${form.weightMin}-${form.weightMax}kg` : form.weightClass;
      const name = isFightingType ? (form.name.trim() || buildFightName(form)) : form.name.trim();

      await api.createContent({
        ...form,
        name,
        mode: sizeMeta.mode,
        memberCount: Number(sizeMeta.memberCount) || 1,
        memberCountMax: Number(sizeMeta.memberCountMax) || Number(sizeMeta.memberCount) || 1,
        ageGroup: form.ageGroupScope === 'all' && isFormType ? '' : form.ageGroup,
        ageGroupScope: isFormType ? form.ageGroupScope : 'specific',
        birthYearFrom: form.birthYearFrom ? Number(form.birthYearFrom) : null,
        birthYearTo: form.birthYearTo ? Number(form.birthYearTo) : null,
        weightMin: form.weightMin ? Number(form.weightMin) : null,
        weightMax: form.weightMax ? Number(form.weightMax) : null,
        weightClass: fightingWeightClass
      });
      setForm(blankForm);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    try {
      await api.deleteContent(id);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <PageHeader
        title="Quản lý nội dung thi"
        subtitle="Tạo nội dung theo từng bước: chọn Quyền hoặc Đối kháng trước, sau đó nhập đúng thông tin cần thiết để đăng ký và tạo lượt/trận tự lọc dữ liệu."
      />
      {error ? <div className="alert">{error}</div> : null}

      <Card>
        <h2>Tạo nội dung theo từng bước</h2>

        <div className="step-tabs">
          <button className={`step-tab ${form.type === CONTENT_TYPES.FORM ? 'active' : ''}`} type="button" onClick={() => chooseType(CONTENT_TYPES.FORM)}>
            1. Quyền / biểu diễn
          </button>
          <button className={`step-tab ${form.type === CONTENT_TYPES.FIGHTING ? 'active' : ''}`} type="button" onClick={() => chooseType(CONTENT_TYPES.FIGHTING)}>
            1. Đối kháng
          </button>
        </div>

        {!form.type ? (
          <div className="empty soft-empty">Chọn loại nội dung trước để mở đúng form nhập thông tin.</div>
        ) : (
          <form className="stack-form content-wizard" onSubmit={submit}>
            {isFormType ? (
              <>
                <div className="wizard-section-title">2. Thông tin nội dung Quyền</div>
                <div className="form-grid-3">
                  <label className="field-label">
                    <span>Tên nội dung Quyền</span>
                    <input
                      required
                      placeholder="Ví dụ: Long hổ quyền, Võ nhạc, Tự vệ nữ..."
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </label>
                  <label className="field-label">
                    <span>Số người thi</span>
                    <select value={form.formSize} onChange={(e) => updateFormSize(e.target.value)}>
                      <option value="1">1 người</option>
                      <option value="4">4 người</option>
                      <option value="6-10">Từ 6-10 người</option>
                    </select>
                  </label>
                  <label className="field-label">
                    <span>Giới tính</span>
                    <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                      <option value="">Không giới hạn</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                    </select>
                  </label>
                  <label className="field-label">
                    <span>Lứa tuổi</span>
                    <select value={form.ageGroupScope} onChange={(e) => setForm({ ...form, ageGroupScope: e.target.value, ageGroup: e.target.value === 'all' ? '' : form.ageGroup })}>
                      <option value="all">Gộp tất cả lứa tuổi</option>
                      <option value="specific">Không gộp, chọn 1 lứa tuổi</option>
                    </select>
                  </label>
                  {form.ageGroupScope === 'specific' ? (
                    <label className="field-label">
                      <span>Chọn lứa tuổi</span>
                      <select value={form.ageGroup} onChange={(e) => setForm({ ...form, ageGroup: e.target.value })} required>
                        <option value="">Chọn lứa tuổi</option>
                        {ageGroupOptions.map((ageGroup) => <option key={ageGroup} value={ageGroup}>{ageGroup}</option>)}
                      </select>
                    </label>
                  ) : null}
                </div>
                <p className="muted">Quyền không yêu cầu hạng cân. Khi gộp tất cả lứa tuổi, đăng ký sẽ không chặn theo lứa tuổi.</p>
              </>
            ) : null}

            {isFightingType ? (
              <>
                <div className="wizard-section-title">2. Thông tin nội dung Đối kháng</div>
                <div className="form-grid-3">
                  <label className="field-label">
                    <span>Giới tính</span>
                    <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} required>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                    </select>
                  </label>
                  <label className="field-label">
                    <span>Lứa tuổi</span>
                    <select value={form.ageGroup} onChange={(e) => setForm({ ...form, ageGroup: e.target.value })} required>
                      <option value="">Chọn lứa tuổi</option>
                      {ageGroupOptions.map((ageGroup) => <option key={ageGroup} value={ageGroup}>{ageGroup}</option>)}
                    </select>
                  </label>
                  <label className="field-label">
                    <span>Hạng cân từ kg</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      required
                      placeholder="Ví dụ: 35"
                      value={form.weightMin}
                      onChange={(e) => setForm({ ...form, weightMin: e.target.value })}
                    />
                  </label>
                  <label className="field-label">
                    <span>Hạng cân đến kg</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      required
                      placeholder="Ví dụ: 40"
                      value={form.weightMax}
                      onChange={(e) => setForm({ ...form, weightMax: e.target.value })}
                    />
                  </label>
                  <label className="field-label wide-field">
                    <span>Tên nội dung, có thể để trống để tự tạo</span>
                    <input
                      placeholder={buildFightName(form)}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </label>
                </div>
                <p className="muted">Đối kháng bắt buộc có giới tính Nam/Nữ, lứa tuổi và khoảng cân. Thí sinh chỉ nhập cân nặng thực tế; hệ thống tự lọc theo hạng cân này.</p>
              </>
            ) : null}

            <div className="wizard-summary">
              <strong>Xem trước:</strong>{' '}
              {isFormType ? (
                <span>{form.name || 'Tên nội dung'} · Quyền · {formSizeLabel({ formSize: form.formSize, memberCount: buildFormSizeMeta(form.formSize).memberCount, memberCountMax: buildFormSizeMeta(form.formSize).memberCountMax })} · {form.gender ? genderLabel(form.gender) : 'Không giới hạn giới tính'} · {form.ageGroupScope === 'all' ? 'Gộp tất cả lứa tuổi' : (form.ageGroup || 'Chọn lứa tuổi')}</span>
              ) : (
                <span>{form.name || buildFightName(form)} · Đối kháng · {genderLabel(form.gender)} · {form.ageGroup || 'Chọn lứa tuổi'} · {form.weightMin || '...'}-{form.weightMax || '...'}kg</span>
              )}
            </div>

            <div className="row-actions">
              <button className="btn btn-primary">Tạo nội dung</button>
              <button className="btn" type="button" onClick={() => setForm(blankForm)}>Làm lại</button>
            </div>
          </form>
        )}
      </Card>

      <Card>
        <h2>Bộ lọc nội dung</h2>
        <div className="filter-grid">
          <input placeholder="Tìm tên nội dung, lứa tuổi, hạng cân..." value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} />
          <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
            <option value="">Tất cả loại</option>
            <option value="form">Quyền</option>
            <option value="fighting">Đối kháng</option>
          </select>
          <select value={filters.gender} onChange={(e) => setFilters({ ...filters, gender: e.target.value })}>
            <option value="">Tất cả giới tính</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>
          <select value={filters.ageGroup} onChange={(e) => setFilters({ ...filters, ageGroup: e.target.value })}>
            <option value="">Tất cả lứa tuổi</option>
            {ageGroups.map((ageGroup) => <option key={ageGroup} value={ageGroup}>{ageGroup}</option>)}
          </select>
          <select value={filters.weightClass} onChange={(e) => setFilters({ ...filters, weightClass: e.target.value })}>
            <option value="">Tất cả hạng cân</option>
            {weightClasses.map((weightClass) => <option key={weightClass} value={weightClass}>{weightClass}</option>)}
          </select>
          <button className="btn" type="button" onClick={() => setFilters(blankFilters)}>Xóa lọc</button>
        </div>
      </Card>

      <Card>
        <h2>Danh sách nội dung</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Tên</th><th>Loại</th><th>Cấu hình</th><th>Giới tính</th><th>Lứa tuổi</th><th>Hạng cân</th><th>Tiêu chí lọc</th><th></th></tr></thead>
            <tbody>
              {filteredContents.map((content) => (
                <tr key={content.id}>
                  <td>{content.name}</td>
                  <td>{typeLabel(content.type)}</td>
                  <td>{content.type === 'form' ? formSizeLabel(content) : 'Cá nhân'}</td>
                  <td>{content.gender ? genderLabel(content.gender) : 'Không giới hạn'}</td>
                  <td>{content.type === 'form' && content.ageGroupScope === 'all' ? 'Gộp tất cả' : (deriveContentAgeGroup(content) || 'Không giới hạn')}</td>
                  <td>{contentWeightClassLabel(content) || '—'}</td>
                  <td>{contentEligibilityText(content) || 'Không giới hạn'}</td>
                  <td><button className="btn btn-danger" onClick={() => remove(content.id)}>Xóa</button></td>
                </tr>
              ))}
              {filteredContents.length === 0 ? <tr><td colSpan="8" className="empty">Không có nội dung phù hợp bộ lọc.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
