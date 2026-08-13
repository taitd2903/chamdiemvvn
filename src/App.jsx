import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminAreas from './pages/AdminAreas.jsx';
import AdminContents from './pages/AdminContents.jsx';
import AdminAthletes from './pages/AdminAthletes.jsx';
import AdminRegistrations from './pages/AdminRegistrations.jsx';
import AdminMatches from './pages/AdminMatches.jsx';
import AdminResults from './pages/AdminResults.jsx';
import AdminLinks from './pages/AdminLinks.jsx';
import AdminSettings from './pages/AdminSettings.jsx';
import JudgeJoinPage from './pages/JudgeJoinPage.jsx';
import FormJudgePage from './pages/FormJudgePage.jsx';
import FormRefereePage from './pages/FormRefereePage.jsx';
import FormScreenPage from './pages/FormScreenPage.jsx';
import FightingJudgePage from './pages/FightingJudgePage.jsx';
import FightingRefereePage from './pages/FightingRefereePage.jsx';
import FightingScreenPage from './pages/FightingScreenPage.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import { useAuth } from './auth.jsx';
import SigmaPage from './pages/SigmaPage.jsx';
import AdminWeighIns from './pages/AdminWeighIns.jsx';
import AccountPage from './pages/AccountPage.jsx';
import PublicTournamentPage from './pages/PublicTournamentPage.jsx';

function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-page">Đang kiểm tra đăng nhập...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'weigh_in' ? '/weigh-in' : '/unit'} replace />;
  return <Layout role={role}>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/weigh-in/login" element={<LoginPage weighIn />} />
      <Route path="/public" element={<PublicTournamentPage />} />
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/areas" element={<ProtectedRoute role="admin"><AdminAreas /></ProtectedRoute>} />
      <Route path="/admin/contents" element={<ProtectedRoute role="admin"><AdminContents /></ProtectedRoute>} />
      <Route path="/admin/athletes" element={<ProtectedRoute role="admin"><AdminAthletes /></ProtectedRoute>} />
      <Route path="/admin/registrations" element={<ProtectedRoute role="admin"><AdminRegistrations /></ProtectedRoute>} />
      <Route path="/admin/matches" element={<ProtectedRoute role="admin"><AdminMatches /></ProtectedRoute>} />
      <Route path="/admin/results" element={<ProtectedRoute role="admin"><AdminResults /></ProtectedRoute>} />
      <Route path="/admin/links" element={<ProtectedRoute role="admin"><AdminLinks /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute role="admin"><AdminSettings /></ProtectedRoute>} />
      <Route path="/admin/sigma" element={<ProtectedRoute role="admin"><SigmaPage /></ProtectedRoute>} />
      <Route path="/admin/weigh-ins" element={<ProtectedRoute role="admin"><AdminWeighIns /></ProtectedRoute>} />
      <Route path="/admin/statistics" element={<ProtectedRoute role="admin"><PublicTournamentPage embedded /></ProtectedRoute>} />
      <Route path="/admin/account" element={<ProtectedRoute role="admin"><AccountPage /></ProtectedRoute>} />
      <Route path="/unit" element={<ProtectedRoute role="unit_owner"><AdminAthletes /></ProtectedRoute>} />
      <Route path="/unit/registrations" element={<ProtectedRoute role="unit_owner"><AdminRegistrations /></ProtectedRoute>} />
      <Route path="/unit/sigma" element={<ProtectedRoute role="unit_owner"><SigmaPage /></ProtectedRoute>} />
      <Route path="/unit/statistics" element={<ProtectedRoute role="unit_owner"><PublicTournamentPage embedded /></ProtectedRoute>} />
      <Route path="/unit/account" element={<ProtectedRoute role="unit_owner"><AccountPage /></ProtectedRoute>} />
      <Route path="/weigh-in" element={<ProtectedRoute role="weigh_in"><AdminWeighIns /></ProtectedRoute>} />
      <Route path="/weigh-in/account" element={<ProtectedRoute role="weigh_in"><AccountPage /></ProtectedRoute>} />
      <Route path="/judge" element={<JudgeJoinPage />} />
      <Route path="/forms/area/:areaId/referee" element={<FormRefereePage />} />
      <Route path="/forms/area/:areaId/judge/:judgeNo" element={<FormJudgePage />} />
      <Route path="/forms/area/:areaId/screen" element={<FormScreenPage />} />
      <Route path="/fighting/area/:areaId/referee" element={<FightingRefereePage />} />
      <Route path="/fighting/area/:areaId/judge/:judgeNo" element={<FightingJudgePage />} />
      <Route path="/fighting/area/:areaId/screen" element={<FightingScreenPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
