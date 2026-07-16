import { Link } from 'react-router-dom';

export default function LoginPage() {
  return (
    <div className="center-page">
      <div className="login-card">
        <h1>Vovinam Realtime</h1>
        <p>Bản demo chưa khóa đăng nhập để bạn test luồng nhanh.</p>
        <Link className="btn btn-primary" to="/admin">Vào Admin</Link>
        <Link className="btn" to="/judge">Vào link giám định</Link>
      </div>
    </div>
  );
}
