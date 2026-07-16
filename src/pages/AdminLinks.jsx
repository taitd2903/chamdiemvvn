import { useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Card, PageHeader, StatusBadge } from '../components/Layout.jsx';
import { useGlobalState } from '../components/hooks.js';
import { statusLabel, typeLabel } from '../components/format.js';

function absoluteUrl(path) {
  return `${window.location.origin}${path}`;
}

function CopyButton({ url }) {
  async function copy() {
    await navigator.clipboard?.writeText(url);
    alert(`Đã copy: ${url}`);
  }

  return <button className="btn btn-small" onClick={copy}>Copy</button>;
}

function CompactLink({ title, subtitle, path, tone = 'neutral' }) {
  const url = absoluteUrl(path);

  return (
    <div className={`compact-link compact-link-${tone}`}>
      <div className="compact-link-info">
        <strong>{title}</strong>
        {subtitle ? <p>{subtitle}</p> : null}
        <code>{url}</code>
      </div>
      <div className="compact-link-actions">
        <div className="qr-wrap qr-small">
          <QRCodeCanvas value={url} size={74} includeMargin />
        </div>
        <CopyButton url={url} />
      </div>
    </div>
  );
}

function AreaLinkCard({ area }) {
  const [showJudges, setShowJudges] = useState(false);
  const screenPath = area.type === 'fighting'
    ? `/fighting/area/${area.id}/screen`
    : `/forms/area/${area.id}/screen`;
  const refereePath = area.type === 'fighting'
    ? `/fighting/area/${area.id}/referee`
    : `/forms/area/${area.id}/referee`;
  const judgeCount = Number(area.judgeCount) || 5;

  return (
    <section className="area-link-card">
      <div className="area-link-top">
        <div>
          <h3>{area.name}</h3>
          <p>ID: {area.id} · {typeLabel(area.type)}</p>
        </div>
        <div className="area-link-badges">
          <StatusBadge>{statusLabel(area.status)}</StatusBadge>
          <StatusBadge tone="neutral">
            {judgeCount} giám định + 1 tổng trọng tài riêng
          </StatusBadge>
        </div>
      </div>

      <div className="quick-link-grid">
        <CompactLink
          title={area.type === 'fighting' ? 'Tổng trọng tài Đối kháng' : 'Tổng trọng tài Quyền'}
          subtitle="Trang riêng cố định của sân, không nằm trong các giám định."
          path={refereePath}
          tone="orange"
        />
        <CompactLink
          title="Màn hình lớn"
          subtitle="Màn tổng điểm read-only realtime."
          path={screenPath}
          tone={area.type === 'fighting' ? 'blue' : 'green'}
        />
        <CompactLink
          title="Link chung giám định"
          subtitle="Dùng khi muốn giám định tự chọn sân và số thứ tự."
          path="/judge"
        />
      </div>

      <div className="judge-link-header">
        <div>
          <h4>Link nhanh giám định của {area.name}</h4>
          <p>Đã gắn sẵn sân và số giám định. Gửi link/QR đúng người để tránh chọn nhầm.</p>
        </div>
        <button className="btn btn-small" onClick={() => setShowJudges((value) => !value)}>
          {showJudges ? 'Ẩn link giám định' : `Hiện ${judgeCount} link giám định`}
        </button>
      </div>

      {showJudges ? (
        <div className="judge-compact-grid">
          {Array.from({ length: judgeCount }, (_, index) => index + 1).map((judgeNo) => (
            <CompactLink
              key={judgeNo}
              title={`GĐ ${judgeNo}`}
              subtitle="Slot giám định chấm/bấm điểm."
              path={`/judge?areaId=${encodeURIComponent(area.id)}&judgeNo=${judgeNo}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default function AdminLinks() {
  const { state, error } = useGlobalState();
  const areas = useMemo(() => state?.areas || [], [state]);
  const formAreas = areas.filter((area) => area.type === 'form');
  const fightingAreas = areas.filter((area) => area.type === 'fighting');

  return (
    <>
      <PageHeader
        title="Cấp link / QR theo từng sân"
        subtitle="Admin dùng trang này để copy link hoặc đưa QR cho tổng trọng tài, giám định và màn hình lớn."
      />
      {error ? <div className="alert">{error}</div> : null}

      <Card className="admin-link-summary">
        <div className="link-summary-grid">
          <div>
            <strong>{areas.length}</strong>
            <span>Tổng sân</span>
          </div>
          <div>
            <strong>{fightingAreas.length}</strong>
            <span>Sân Đối kháng</span>
          </div>
          <div>
            <strong>{formAreas.length}</strong>
            <span>Sân Quyền</span>
          </div>
        </div>
        <p className="note">
          Mỗi sân đều có Tổng trọng tài riêng để điều hành. Tổng trọng tài không nằm trong các slot giám định. Giám định Quyền là GĐ1-GĐ5; Đối kháng là GĐ1-GĐ5 hoặc GĐ1-GĐ4.
        </p>
      </Card>

      <Card>
        <h2>Link chung cho toàn bộ giám định</h2>
        <CompactLink
          title="/judge"
          subtitle="Giám định mở link này → chọn sân → chọn vị trí. Không dùng cho tổng trọng tài."
          path="/judge"
        />
      </Card>

      {fightingAreas.length ? (
        <Card>
          <h2>Sân Đối kháng</h2>
          <div className="area-link-grid">
            {fightingAreas.map((area) => <AreaLinkCard key={area.id} area={area} />)}
          </div>
        </Card>
      ) : null}

      {formAreas.length ? (
        <Card>
          <h2>Sân Quyền</h2>
          <div className="area-link-grid">
            {formAreas.map((area) => <AreaLinkCard key={area.id} area={area} />)}
          </div>
        </Card>
      ) : null}
    </>
  );
}
