import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Card, PageHeader } from '../components/Layout.jsx';
import { useGlobalState } from '../components/hooks.js';

export default function AdminSettings() {
  const { state, error, reload, setError } = useGlobalState();
  const [form, setForm] = useState({ tournamentName: '', logoLeftUrl: '', logoRightUrl: '', formContentLimitPerUnit: '', fightingContentLimitPerUnit: '' });
  const [saved, setSaved] = useState('');
  const [resetting, setResetting] = useState(false);
  const [clearingFights, setClearingFights] = useState(false);

  useEffect(() => {
    if (state?.settings) {
      setForm({
        tournamentName: state.settings.tournamentName || '',
        logoLeftUrl: state.settings.logoLeftUrl || '',
        logoRightUrl: state.settings.logoRightUrl || ''
        ,formContentLimitPerUnit: state.settings.formContentLimitPerUnit || ''
        ,fightingContentLimitPerUnit: state.settings.fightingContentLimitPerUnit || ''
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

  async function clearFightingData() {
    const confirmed = window.confirm(
      'Xóa toàn bộ trận Đối kháng và sơ đồ Sigma?\n\n' +
      'GIỮ NGUYÊN: tài khoản, đơn vị, thí sinh, nội dung, đăng ký và lượt thi Quyền.\n\n' +
      'Sau khi xóa, bạn có thể vào Sigma để bốc thăm lại.'
    );
    if (!confirmed) return;
    setClearingFights(true);
    try {
      const result = await api.clearFightingData();
      setSaved(result.message);
      reload();
      setTimeout(() => setSaved(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setClearingFights(false);
    }
  }

  const counters = {
    athletes: state?.athletes?.length || 0,
    registrations: state?.registrations?.length || 0,
    formEntries: state?.formEntries?.length || 0,
    fightMatches: state?.fightMatches?.length || 0
  };

  return (
    <div className="admin-settings-page">
      <PageHeader
        title="Cài đặt giải đấu"
        subtitle="Tên giải được dùng ở màn trình chiếu Quyền và Đối kháng. Có thể reset dữ liệu thi đấu để nhập giải mới."
      />
      {error ? <div className="alert">{error}</div> : null}
      {saved ? <div className="success-alert">{saved}</div> : null}

      <div className="settings-primary-grid">
      <Card className="settings-config-card">
        <div className="settings-card-heading"><span>01</span><div><h2>Thông tin giải đấu</h2><p>Tên và nhận diện xuất hiện trên các màn trình chiếu.</p></div></div>
        <form className="stack-form settings-form" onSubmit={submit}>
          <label className="field-label">
            <span>Tên giải</span>
            <input
              placeholder="Ví dụ: GIẢI VOVINAM HỌC SINH PHƯỜNG TÙNG THIỆN NH 2025-2026"
              value={form.tournamentName}
              onChange={(e) => setForm({ ...form, tournamentName: e.target.value })}
            />
          </label>
          <div className="settings-section-title"><strong>Giới hạn tham gia tùy chọn</strong><span>Để trống nếu cho phép mỗi đoàn tham gia tất cả nội dung.</span></div>
          <div className="participation-limit-grid">
            <label className="field-label">
              <span>Giới hạn nội dung Quyền mỗi đoàn</span>
              <input type="number" min="1" step="1" placeholder="Để trống = tham gia tất cả" value={form.formContentLimitPerUnit} onChange={(e) => setForm({ ...form, formContentLimitPerUnit: e.target.value })} />
              <small>Ví dụ nhập 3: mỗi đoàn chỉ được đăng ký tối đa 3 nội dung Quyền.</small>
          </label>
          <label className="field-label">
              <span>Giới hạn nội dung Đối kháng mỗi đoàn</span>
              <input type="number" min="1" step="1" placeholder="Để trống = tham gia tất cả" value={form.fightingContentLimitPerUnit} onChange={(e) => setForm({ ...form, fightingContentLimitPerUnit: e.target.value })} />
              <small>Ví dụ nhập 5: mỗi đoàn chỉ được đăng ký tối đa 5 nội dung Đối kháng.</small>
          </label></div>
          <div className="settings-save-row"><span>Mọi thay đổi áp dụng cho toàn bộ các đoàn trong giải.</span><button className="btn btn-primary">Lưu cài đặt giải</button></div>
        </form>
      </Card>

      <Card className="settings-preview-card">
        <div className="settings-card-heading"><span>02</span><div><h2>Xem trước trình chiếu</h2><p>Kiểm tra nhanh tên giải và hai logo.</p></div></div>
        <div className="tournament-preview">
          {form.logoLeftUrl ? <img src={form.logoLeftUrl} alt="Logo trái" /> : <span className="logo-placeholder">Logo trái</span>}
          <strong>{form.tournamentName || 'Tên giải sẽ hiển thị ở đây'}</strong>
          {form.logoRightUrl ? <img src={form.logoRightUrl} alt="Logo phải" /> : <span className="logo-placeholder">Logo phải</span>}
        </div>
      </Card>
      </div>

      <div className="settings-danger-heading"><span>Vùng quản lý dữ liệu</span><p>Các thao tác bên dưới ảnh hưởng tới dữ liệu thi đấu. Hãy kiểm tra kỹ trước khi xác nhận.</p></div>
      <div className="settings-danger-grid">
      <Card className="settings-danger-card settings-danger-card-soft">
        <h2>Bốc thăm lại Đối kháng</h2>
        <p className="note">Chỉ xóa các trận Đối kháng, kết quả trận và sơ đồ Sigma. Tất cả thí sinh cùng đăng ký nội dung của họ được giữ nguyên.</p>
        <div className="reset-danger-zone fighting-clear-zone">
          <div><strong>Dữ liệu được giữ nguyên</strong><p>Tài khoản, Chủ đơn vị, thí sinh, nội dung, đăng ký và toàn bộ lượt thi Quyền.</p></div>
          <button className="btn btn-danger" type="button" disabled={clearingFights || counters.fightMatches === 0} onClick={clearFightingData}>
            {clearingFights ? 'Đang xóa...' : `Xóa ${counters.fightMatches} trận Đối kháng`}
          </button>
        </div>
      </Card>

      <Card className="settings-danger-card">
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
      </div>
    </div>
  );
}
