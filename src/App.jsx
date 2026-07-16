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

function AdminRoute({ children }) {
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/areas" element={<AdminRoute><AdminAreas /></AdminRoute>} />
      <Route path="/admin/contents" element={<AdminRoute><AdminContents /></AdminRoute>} />
      <Route path="/admin/athletes" element={<AdminRoute><AdminAthletes /></AdminRoute>} />
      <Route path="/admin/registrations" element={<AdminRoute><AdminRegistrations /></AdminRoute>} />
      <Route path="/admin/matches" element={<AdminRoute><AdminMatches /></AdminRoute>} />
      <Route path="/admin/results" element={<AdminRoute><AdminResults /></AdminRoute>} />
      <Route path="/admin/links" element={<AdminRoute><AdminLinks /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
      <Route path="/judge" element={<JudgeJoinPage />} />
      <Route path="/forms/area/:areaId/referee" element={<FormRefereePage />} />
      <Route path="/forms/area/:areaId/judge/:judgeNo" element={<FormJudgePage />} />
      <Route path="/forms/area/:areaId/screen" element={<FormScreenPage />} />
      <Route path="/fighting/area/:areaId/referee" element={<FightingRefereePage />} />
      <Route path="/fighting/area/:areaId/judge/:judgeNo" element={<FightingJudgePage />} />
      <Route path="/fighting/area/:areaId/screen" element={<FightingScreenPage />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
