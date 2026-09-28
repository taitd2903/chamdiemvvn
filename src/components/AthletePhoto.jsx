import { api } from '../api.js';

export function AthletePhoto({ athlete, size = 'medium', className = '' }) {
  const label = athlete?.name || athlete?.participantName || 'VĐV';
  const photoUrl = athlete?.photoUrl || '';
  return photoUrl
    ? <img className={`athlete-photo athlete-photo-${size} ${className}`} src={`${api.apiUrl}${photoUrl}`} alt={`Ảnh ${label}`} />
    : <span className={`athlete-photo athlete-photo-${size} athlete-photo-placeholder ${className}`} aria-label={`Chưa có ảnh ${label}`}>{label.trim().charAt(0).toUpperCase() || 'V'}</span>;
}

export async function prepareAthletePhoto(file) {
  if (!file) return '';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP');
  if (file.size > 3 * 1024 * 1024) throw new Error('Ảnh không được vượt quá 3 MB');
  const bitmap = await createImageBitmap(file);
  const maxSize = 900;
  const ratio = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
  canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return canvas.toDataURL('image/webp', 0.82);
}
