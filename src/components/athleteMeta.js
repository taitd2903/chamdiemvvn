export const GENDER_OPTIONS = [
  { value: '', label: 'Tất cả giới tính' },
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' }
];

export function genderLabel(value) {
  if (value === 'male') return 'Nam';
  if (value === 'female') return 'Nữ';
  if (value === 'other') return 'Khác';
  return '—';
}

export function getCurrentYear() {
  return new Date().getFullYear();
}

export function getAgeFromBirthYear(birthYear) {
  const year = Number(birthYear);
  if (!year) return null;
  return getCurrentYear() - year;
}

export function deriveAgeGroup(birthYear) {
  const age = getAgeFromBirthYear(birthYear);
  if (!age || age < 0) return '';
  if (age <= 10) return 'Nhi đồng';
  if (age <= 12) return 'Lứa tuổi 1';
  if (age <= 15) return 'Lứa tuổi 2';
  if (age <= 18) return 'Lứa tuổi 3';
  return 'Thanh niên';
}

export function formatAgeInfo(athlete) {
  const birthYear = athlete?.birthYear;
  const age = getAgeFromBirthYear(birthYear);
  const ageGroup = athlete?.ageGroup || deriveAgeGroup(birthYear);
  if (!birthYear && !ageGroup) return '—';
  return [ageGroup, birthYear ? `NS ${birthYear}` : '', age ? `${age} tuổi` : ''].filter(Boolean).join(' · ');
}

export function formatWeightInfo(athlete) {
  const weightKg = athlete?.weightKg;
  if (!weightKg) return '—';
  return `${weightKg}kg`;
}

export function athleteDisplay(athlete) {
  if (!athlete) return '';
  const meta = [athlete.unit, genderLabel(athlete.gender), formatAgeInfo(athlete), formatWeightInfo(athlete)]
    .filter((item) => item && item !== '—')
    .join(' · ');
  return meta ? `${athlete.name} (${meta})` : athlete.name;
}


export function contentFormSizeLabel(content = {}) {
  if (!content) return '';
  if (content.formSize === '6-10') return '6-10 người';
  if (content.formSize === '4') return '4 người';
  if (content.formSize === '1') return '1 người';
  if (content.memberCountMax && content.memberCountMax !== content.memberCount) return `${content.memberCount}-${content.memberCountMax} người`;
  if (content.memberCount) return `${content.memberCount} người`;
  return '';
}

export function contentAgeGroupLabel(content = {}) {
  if (content?.type === 'form' && content.ageGroupScope === 'all') return 'Gộp tất cả lứa tuổi';
  return deriveContentAgeGroup(content) || '';
}

export function getUniqueValues(rows, key) {
  return [...new Set((rows || []).map((row) => row?.[key]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'vi'));
}

export function normalizeText(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function numberFromText(value) {
  const parsed = Number(String(value || '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export function deriveContentAgeGroup(content) {
  if (!content) return '';
  if (content.type === 'form' && content.ageGroupScope === 'all') return '';
  if (content.ageGroup) return content.ageGroup;

  const text = normalizeText(content.name);
  if (text.includes('nhi dong')) return 'Nhi đồng';
  if (text.includes('lua tuoi 1') || text.includes('lt1')) return 'Lứa tuổi 1';
  if (text.includes('lua tuoi 2') || text.includes('lt2')) return 'Lứa tuổi 2';
  if (text.includes('lua tuoi 3') || text.includes('lt3')) return 'Lứa tuổi 3';
  if (text.includes('thanh nien')) return 'Thanh niên';
  return '';
}

export function parseWeightRange(value) {
  const text = normalizeText(value).replace(/kg|kgs|can|hang can/g, ' ');
  const range = text.match(/(\d+(?:[.,]\d+)?)\s*(?:-|–|—|den|toi|to)\s*(\d+(?:[.,]\d+)?)/i);
  if (!range) return { min: null, max: null };

  const min = numberFromText(range[1]);
  const max = numberFromText(range[2]);
  if (min === null || max === null) return { min: null, max: null };
  return min <= max ? { min, max } : { min: max, max: min };
}

export function deriveContentWeightRange(content) {
  if (!content) return { min: null, max: null };

  const directMin = content.weightMin !== null && content.weightMin !== undefined && content.weightMin !== ''
    ? Number(content.weightMin)
    : null;
  const directMax = content.weightMax !== null && content.weightMax !== undefined && content.weightMax !== ''
    ? Number(content.weightMax)
    : null;

  if (Number.isFinite(directMin) || Number.isFinite(directMax)) {
    return {
      min: Number.isFinite(directMin) ? directMin : null,
      max: Number.isFinite(directMax) ? directMax : null
    };
  }

  const fromWeightClass = parseWeightRange(content.weightClass);
  if (fromWeightClass.min !== null || fromWeightClass.max !== null) return fromWeightClass;

  return parseWeightRange(content.name);
}

export function deriveContentGender(content) {
  if (!content) return '';
  if (content.gender) return content.gender;
  const text = normalizeText(content.name);
  if (/(^|\s)(nam|male)(\s|$)/.test(text)) return 'male';
  if (/(^|\s)(nu|female)(\s|$)/.test(text)) return 'female';
  return '';
}

export function contentEligibilityText(content) {
  if (!content) return '';
  const parts = [];
  const gender = deriveContentGender(content);
  const ageGroup = deriveContentAgeGroup(content);
  const weightRange = deriveContentWeightRange(content);

  if (content.type === 'form') {
    const sizeLabel = contentFormSizeLabel(content);
    if (sizeLabel) parts.push(sizeLabel);
  }
  if (gender) parts.push(genderLabel(gender));
  else if (content.type === 'form') parts.push('Không giới hạn giới tính');

  if (content.type === 'form' && content.ageGroupScope === 'all') parts.push('Gộp tất cả lứa tuổi');
  else if (ageGroup) parts.push(ageGroup);

  if (content.birthYearFrom || content.birthYearTo) parts.push(`NS ${content.birthYearFrom || '...'}-${content.birthYearTo || '...'}`);
  if (weightRange.min !== null || weightRange.max !== null) parts.push(`${weightRange.min ?? '...'}-${weightRange.max ?? '...'}kg`);
  else if (content.weightClass) parts.push(content.weightClass);
  return parts.join(' · ');
}

export function matchesContentCriteria(athlete, content) {
  if (!athlete || !content) return false;

  const contentGender = deriveContentGender(content);
  if (contentGender && athlete.gender !== contentGender) return false;

  const contentAgeGroup = deriveContentAgeGroup(content);
  if (contentAgeGroup && (athlete.ageGroup || deriveAgeGroup(athlete.birthYear)) !== contentAgeGroup) return false;

  const birthYear = Number(athlete.birthYear) || null;
  if (content.birthYearFrom && (!birthYear || birthYear < Number(content.birthYearFrom))) return false;
  if (content.birthYearTo && (!birthYear || birthYear > Number(content.birthYearTo))) return false;

  const weightKg = Number(athlete.weightKg) || null;
  const weightRange = deriveContentWeightRange(content);
  if (weightRange.min !== null && (!weightKg || weightKg < weightRange.min)) return false;
  if (weightRange.max !== null && (!weightKg || weightKg > weightRange.max)) return false;

  // Hạng cân của thí sinh KHÔNG nhập tay.
  // Nếu nội dung có khoảng cân parse được thì dùng cân nặng thực tế để lọc.
  // Nếu nội dung chỉ có chữ tự do mà không parse được khoảng cân thì không chặn thí sinh ở đây.
  return true;
}

export function buildAthleteSnapshot(athlete) {
  if (!athlete) return {};
  return {
    participantName: athlete.name || '',
    participantUnit: athlete.unit || '',
    ageGroup: athlete.ageGroup || deriveAgeGroup(athlete.birthYear),
    gender: athlete.gender || '',
    birthYear: athlete.birthYear || '',
    weightKg: athlete.weightKg || '',
    weightClass: ''
  };
}


export function contentWeightClassLabel(content) {
  if (!content) return '';
  if (content.weightClass) return content.weightClass;
  const range = deriveContentWeightRange(content);
  if (range.min !== null || range.max !== null) return `${range.min ?? '...'}-${range.max ?? '...'}kg`;
  return '';
}

export function getContentWeightClassOptions(contents = []) {
  const map = new Map();
  contents.forEach((content) => {
    const label = contentWeightClassLabel(content);
    if (!label) return;
    const key = normalizeText(label);
    if (!map.has(key)) map.set(key, label);
  });
  return [...map.values()].sort((a, b) => a.localeCompare(b, 'vi'));
}

export function athleteMatchesWeightClass(athlete, weightClass, contents = []) {
  if (!weightClass) return true;
  const content = contents.find((item) => normalizeText(contentWeightClassLabel(item)) === normalizeText(weightClass));
  if (!content) return false;
  const weightKg = Number(athlete?.weightKg) || null;
  const range = deriveContentWeightRange(content);
  if (range.min !== null && (!weightKg || weightKg < range.min)) return false;
  if (range.max !== null && (!weightKg || weightKg > range.max)) return false;
  return range.min !== null || range.max !== null;
}

export function eligibleWeightClassLabels(athlete, contents = []) {
  return getContentWeightClassOptions(contents).filter((weightClass) => athleteMatchesWeightClass(athlete, weightClass, contents));
}

export function formatRegistrationWeightInfo(athlete, content) {
  const parts = [];
  if (athlete?.weightKg) parts.push(`${athlete.weightKg}kg thực tế`);
  const weightClass = contentWeightClassLabel(content);
  if (weightClass) parts.push(`Hạng ${weightClass}`);
  return parts.length ? parts.join(' · ') : '—';
}
