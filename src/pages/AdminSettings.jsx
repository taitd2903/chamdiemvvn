import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Card, PageHeader } from '../components/Layout.jsx';
import { useGlobalState } from '../components/hooks.js';

export default function AdminSettings() {
  const { state, error, reload, setError } = useGlobalState();
  const [form, setForm] = useState({ tournamentName: '', logoLeftUrl: '', logoRightUrl: '' });
  const [saved, setSaved] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (state?.settings) {
      setForm({
        tournamentName: state.settings.tournamentName || '',
        logoLeftUrl: state.settings.logoLeftUrl || '',
        logoRightUrl: state.settings.logoRightUrl || ''
      });
    }
  }, [state]);

  async function submit(event) {
    event.preventDefault();
    try {
      await api.updateSettings(form);
      setSaved('Đã lưu cấu hình giải. Các màn trình chiếu sẽ cập nhật realtime.');
      reload();
      setTimeout(() => setSaved(''), 2500);
    } catch (err) {
      setError(err.message);
    }
  }

  async function resetTournamentData() {
    const confirmed = window.confirm(
      'Bạn chắc chắn muốn reset dữ liệu thi đấu?\n\n' +
        'Hành động này sẽ xóa toàn bộ thí sinh/đội, đăng ký, lượt thi Quyền và trận Đối kháng.\n\n' +
        'Hệ thống sẽ GIỮ NGUYÊN:\n' +
        '- Tên giải và logo\n' +
        '- Sân thi đấu\n' +
        '- Loại sân\n' +
        '- Số giám định\n' +
        '- Nội dung thi\n' +
        '- Toàn bộ logic Quyền và Đối kháng'
    );

    if (!confirmed) return;

    setResetting(true);
    try {
      await api.resetTournamentData();
      setSaved('Đã reset dữ liệu thi đấu. Hiện không còn thí sinh, đăng ký, lượt thi Quyền hoặc trận Đối kháng.');
      reload();
      setTimeout(() => setSaved(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setResetting(false);
    }
  }

  const counters = {
    athletes: state?.athletes?.length || 0,
    registrations: state?.registrations?.length || 0,
    formEntries: state?.formEntries?.length || 0,
    fightMatches: state?.fightMatches?.length || 0
  };

  return (
    <>
      <PageHeader
        title="Cài đặt giải đấu"
        subtitle="Tên giải được dùng ở màn trình chiếu Quyền và Đối kháng. Có thể reset dữ liệu thi đấu để nhập giải mới."
      />
      {error ? <div className="alert">{error}</div> : null}
      {saved ? <div className="success-alert">{saved}</div> : null}

      <Card>
        <h2>Thông tin hiển thị</h2>
        <form className="stack-form" onSubmit={submit}>
          <label className="field-label">
            <span>Tên giải</span>
            <input
              placeholder="Ví dụ: GIẢI VOVINAM HỌC SINH PHƯỜNG TÙNG THIỆN NH 2025-2026"
              value={form.tournamentName}
              onChange={(e) => setForm({ ...form, tournamentName: e.target.value })}
            />
          </label>
          <label className="field-label">
            <span>Logo trái URL, không bắt buộc</span>
            <input
              placeholder="https://..."
              value={form.logoLeftUrl}
              onChange={(e) => setForm({ ...form, logoLeftUrl: e.target.value })}
            />
          </label>
          <label className="field-label">
            <span>Logo phải URL, không bắt buộc</span>
            <input
              placeholder="https://..."
              value={form.logoRightUrl}
              onChange={(e) => setForm({ ...form, logoRightUrl: e.target.value })}
            />
          </label>
          <button className="btn btn-primary">Lưu cài đặt</button>
        </form>
      </Card>

      <Card>
        <h2>Xem trước tên giải</h2>
        <div className="tournament-preview">
          {form.logoLeftUrl ? <img src={form.logoLeftUrl} alt="Logo trái" /> : <span className="logo-placeholder">Logo</span>}
          <strong>{form.tournamentName || 'Tên giải sẽ hiển thị ở đây'}</strong>
          {form.logoRightUrl ? <img src={form.logoRightUrl} alt="Logo phải" /> : <span className="logo-placeholder">Logo</span>}
        </div>
      </Card>

      <Card>
        <h2>Reset dữ liệu thi đấu</h2>
        <p className="note">
          Dùng khi muốn đưa giải về trạng thái sạch để nhập lại từ đầu. Chức năng này chỉ xóa dữ liệu vận hành,
          không thay đổi tên giải, logo, sân thi đấu, loại sân, số giám định, nội dung thi và logic chấm điểm.
        </p>

        <div className="reset-summary-grid">
          <div className="reset-summary-item">
            <strong>{counters.athletes}</strong>
            <span>Thí sinh/đội</span>
          </div>
          <div className="reset-summary-item">
            <strong>{counters.registrations}</strong>
            <span>Đăng ký</span>
          </div>
          <div className="reset-summary-item">
            <strong>{counters.formEntries}</strong>
            <span>Lượt thi Quyền</span>
          </div>
          <div className="reset-summary-item">
            <strong>{counters.fightMatches}</strong>
            <span>Trận Đối kháng</span>
          </div>
        </div>

        <div className="reset-danger-zone">
          <div>
            <strong>Dữ liệu sẽ bị xóa</strong>
            <p>
              Thí sinh/đội, đăng ký, lượt thi Quyền, trận Đối kháng, trạng thái đang chạy của sân và vị trí giám định đang kết nối.
            </p>
          </div>
          <button className="btn btn-danger" type="button" disabled={resetting} onClick={resetTournamentData}>
            {resetting ? 'Đang reset...' : 'Reset dữ liệu thi đấu'}
          </button>
        </div>
      </Card>
    </>
  );
}
