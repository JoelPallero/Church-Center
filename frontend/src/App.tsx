import type { FC } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ModuleGuard } from './components/layout/ModuleGuard';

// Shared / Core Pages
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { InvitationSettings } from './pages/InvitationSettings';
import { PrivacySupport } from './pages/PrivacySupport';
import { LiveDebug } from './pages/LiveDebug';
import { GoogleCallback } from './pages/GoogleCallback';
import { AcceptInvite } from './pages/AcceptInvite';
import { MainDashboard } from './pages/MainDashboard';

// Worship Module
import { WorshipDashboard } from './modules/worship/pages/WorshipDashboard';
import { SongList } from './modules/worship/pages/SongList';
import { SongDetail } from './modules/worship/pages/SongDetail';
import { SongEditor } from './modules/worship/pages/SongEditor';
import { PendingApprovals } from './modules/worship/pages/PendingApprovals';
import { Playlists } from './modules/worship/pages/Playlists';
import { PlaylistDetail } from './modules/worship/pages/PlaylistDetail';
import { CalendarPage } from './modules/worship/reunions/CalendarPage';

// MainHub Module
import { MainHubDashboard } from './modules/mainhub/pages/MainHubDashboard';
import { PeopleList } from './modules/mainhub/pages/people/PeopleList';
import { TeamsList } from './modules/mainhub/pages/people/TeamsList';
import { InvitePerson } from './modules/mainhub/pages/people/InvitePerson';
import { MemberApprovals } from './modules/mainhub/pages/people/MemberApprovals';
import { GroupSelection } from './modules/mainhub/pages/people/GroupSelection';
import { Reports } from './modules/mainhub/pages/Reports';
import { MasterDashboard } from './modules/mainhub/pages/MasterDashboard';
import { PastorDashboard } from './modules/mainhub/pages/PastorDashboard';
import { ChurchList } from './modules/mainhub/pages/people/ChurchList';
import { ChurchEditor } from './modules/mainhub/pages/people/ChurchEditor';
import { AreaList } from './modules/mainhub/pages/people/AreaList';
import { AreaSetup } from './modules/mainhub/pages/people/AreaSetup';
import { TeamSetup } from './modules/mainhub/pages/people/TeamSetup';
import { ChurchSelect } from './modules/mainhub/pages/people/ChurchSelect';
import { UshersDashboard } from './modules/mainhub/pages/ushers/UshersDashboard';
import { AttendanceEntry } from './modules/mainhub/pages/ushers/AttendanceEntry';
import { PermissionsManager } from './pages/admin/PermissionsManager';

// Social Module
import { SocialDashboard } from './modules/social/pages/SocialDashboard';

const App: FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/google/callback" element={<GoogleCallback />} />
              <Route path="/accept-invite" element={<AcceptInvite />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  {/* Global / Selection Dashboard */}
                  <Route index element={<MainDashboard />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="settings/invitations" element={<InvitationSettings />} />
                  <Route path="privacy" element={<PrivacySupport />} />
                  <Route path="debug" element={<LiveDebug />} />

                  {/* Worship Hub */}
                  <Route path="worship" element={<ModuleGuard moduleKey="worship" />}>
                    <Route index element={<WorshipDashboard />} />
                    <Route path="songs" element={<SongList />} />
                    <Route path="songs/new" element={<SongEditor />} />
                    <Route path="songs/:id" element={<SongDetail />} />
                    <Route path="songs/:id/edit" element={<SongEditor />} />
                    <Route path="songs/approvals" element={<PendingApprovals />} />
                    <Route path="playlists" element={<Playlists />} />
                    <Route path="playlists/:id" element={<PlaylistDetail />} />
                    <Route path="calendar" element={<CalendarPage />} />
                  </Route>

                  {/* Social Hub */}
                  <Route path="social" element={<ModuleGuard moduleKey="social" />}>
                    <Route index element={<SocialDashboard />} />
                  </Route>

                  {/* MainHub (Pastoral/Admin) */}
                  <Route path="mainhub" element={<ModuleGuard moduleKey="mainhub" />}>
                    <Route index element={<MainHubDashboard />} />
                    <Route path="people" element={<PeopleList />} />
                    <Route path="people/approvals" element={<MemberApprovals />} />
                    <Route path="people/invite" element={<InvitePerson />} />
                    <Route path="teams" element={<TeamsList />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="master" element={<MasterDashboard />} />
                    <Route path="pastor" element={<PastorDashboard />} />
                    <Route path="ushers" element={<UshersDashboard />} />
                    <Route path="ushers/attendance/:meetingId" element={<AttendanceEntry />} />
                    <Route path="churches" element={<ChurchList />} />
                    <Route path="churches/new" element={<ChurchEditor />} />
                    <Route path="churches/edit/:id" element={<ChurchEditor />} />
                    <Route path="areas" element={<AreaList />} />
                    <Route path="setup-areas" element={<AreaSetup />} />
                    <Route path="setup-teams" element={<TeamSetup />} />
                    <Route path="select-church/:target" element={<ChurchSelect />} />
                    <Route path="admin/permissions" element={<PermissionsManager />} />
                    <Route path="join-teams" element={<GroupSelection />} />
                  </Route>

                  {/* Legacy Redirects for Backward Compatibility */}
                  <Route path="churches/*" element={<Navigate to="/mainhub/churches" replace />} />
                  <Route path="songs/*" element={<Navigate to="/worship/songs" replace />} />
                  <Route path="playlists/*" element={<Navigate to="/worship/playlists" replace />} />
                  <Route path="reunions/*" element={<Navigate to="/worship/calendar" replace />} />
                  <Route path="people/*" element={<Navigate to="/mainhub/people" replace />} />
                  <Route path="teams/*" element={<Navigate to="/mainhub/teams" replace />} />
                  <Route path="reports/*" element={<Navigate to="/mainhub/reports" replace />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
