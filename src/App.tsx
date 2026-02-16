import type { FC } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Profile } from './pages/Profile';
import { SongList } from './pages/songs/SongList';
import { SongDetail } from './pages/songs/SongDetail';
import { PeopleList } from './pages/people/PeopleList';
import { TeamsList } from './pages/people/TeamsList';
import { InvitePerson } from './pages/people/InvitePerson';
import { ChurchList } from './pages/people/ChurchList';
import { ChurchEditor } from './pages/people/ChurchEditor';
import { SongEditor } from './pages/songs/SongEditor';
import { PendingApprovals } from './pages/songs/PendingApprovals';
import { Playlists } from './pages/songs/Playlists';
import { PlaylistDetail } from './pages/songs/PlaylistDetail';
import { PrivacySupport } from './pages/PrivacySupport';
import { AcceptInvite } from './pages/AcceptInvite';
import { GroupSelection } from './pages/people/GroupSelection';
import { MemberApprovals } from './pages/people/MemberApprovals';
import { Reports } from './pages/Reports';
import { LiveDebug } from './pages/LiveDebug';
import { Settings } from './pages/Settings';
import { GoogleCallback } from './pages/GoogleCallback';
import { PermissionsManager } from './pages/admin/PermissionsManager';
import { CalendarPage } from './pages/reunions/CalendarPage';

const App: FC = () => {

  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/join-teams" element={<GroupSelection />} />
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Dashboard />} />

                <Route path="songs" element={<SongList />} />
                <Route path="songs/new" element={<SongEditor />} />
                <Route path="songs/:id" element={<SongDetail />} />
                <Route path="songs/:id/edit" element={<SongEditor />} />
                <Route path="songs/approvals" element={<PendingApprovals />} />
                <Route path="playlists" element={<Playlists />} />
                <Route path="playlists/:id" element={<PlaylistDetail />} />

                <Route path="people" element={<PeopleList />} />
                <Route path="people/approvals" element={<MemberApprovals />} />
                <Route path="reports" element={<Reports />} />
                <Route path="people/invite" element={<InvitePerson />} />
                <Route path="teams" element={<TeamsList />} />
                <Route path="churches" element={<ChurchList />} />
                <Route path="churches/new" element={<ChurchEditor />} />

                <Route path="reunions" element={<CalendarPage />} />

                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="privacy" element={<PrivacySupport />} />
                <Route path="debug" element={<LiveDebug />} />
                <Route path="admin/permissions" element={<PermissionsManager />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
