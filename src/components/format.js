export function typeLabel(type) {
  return type === 'form' ? 'Quyền' : 'Đối kháng';
}

export function statusLabel(status) {
  const map = {
    idle: 'Rảnh',
    form_running: 'Đang chấm Quyền',
    fighting_running: 'Đang đấu',
    paused: 'Tạm dừng',
    finished: 'Đã kết thúc',
    locked: 'Đã khóa',
    pending: 'Chưa thi/đấu',
    running: 'Đang chạy',
    skipped: 'Tạm bỏ qua',
    completed: 'Đã chấm xong',
    cancelled: 'Hủy',
    break: 'Nghỉ giữa hiệp',
    golden: 'Điểm vàng',
    decision: 'Chờ trọng tài quyết định',
    empty: 'Trống',
    connected: 'Đã kết nối',
    disconnected: 'Mất kết nối'
  };
  return map[status] || status;
}

export function sideLabel(side) {
  return side === 'red' ? 'Đỏ' : side === 'blue' ? 'Xanh' : '-';
}

export function formatTime(seconds = 0) {
  const safe = Math.max(0, Number(seconds) || 0);
  const m = Math.floor(safe / 60).toString().padStart(2, '0');
  const s = Math.floor(safe % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function resultText(match) {
  if (!match?.winner) return 'Chưa có';
  return `${sideLabel(match.winner)} thắng${match.winReason ? ` - ${match.winReason}` : ''}`;
}
