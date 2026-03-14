import type { FC } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { TutorialProvider } from './context/TutorialContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ModuleGuard } from './components/layout/ModuleGuard';
import { DevProfileSelector } from './components/dev/DevProfileSelector';
import { Suspense, lazy } from 'react';

// Shared / Core Pages
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const InvitationSettings = lazy(() => import('./pages/InvitationSettings').then(m => ({ default: m.InvitationSettings })));
const PrivacySupport = lazy(() => import('./pages/PrivacySupport').then(m => ({ default: m.PrivacySupport })));
const GoogleCallback = lazy(() => import('./pages/GoogleCallback').then(m => ({ default: m.GoogleCallback })));
const AcceptInvite = lazy(() => import('./pages/AcceptInvite').then(m => ({ default: m.AcceptInvite })));
const MainDashboard = lazy(() => import('./pages/MainDashboard').then(m => ({ default: m.MainDashboard })));

// Worship Module
const WorshipDashboard = lazy(() => import('./modules/worship/pages/WorshipDashboard').then(m => ({ default: m.WorshipDashboard })));
const SongList = lazy(() => import('./modules/worship/pages/SongList').then(m => ({ default: m.SongList })));
const SongDetail = lazy(() => import('./modules/worship/pages/SongDetail').then(m => ({ default: m.SongDetail })));
const SongEditor = lazy(() => import('./modules/worship/pages/SongEditor').then(m => ({ default: m.SongEditor })));
const PendingApprovals = lazy(() => import('./modules/worship/pages/PendingApprovals').then(m => ({ default: m.PendingApprovals })));
const Playlists = lazy(() => import('./modules/worship/pages/Playlists').then(m => ({ default: m.Playlists })));
const PlaylistDetail = lazy(() => import('./modules/worship/pages/PlaylistDetail').then(m => ({ default: m.PlaylistDetail })));
const CalendarPage = lazy(() => import('./modules/worship/reunions/CalendarPage').then(m => ({ default: m.CalendarPage })));

// MainHub Module
const MainHubDashboard = lazy(() => import('./modules/mainhub/pages/MainHubDashboard').then(m => ({ default: m.MainHubDashboard })));
const PeopleList = lazy(() => import('./modules/mainhub/pages/people/PeopleList').then(m => ({ default: m.PeopleList })));
const TeamsList = lazy(() => import('./modules/mainhub/pages/people/TeamsList').then(m => ({ default: m.TeamsList })));
const InvitePerson = lazy(() => import('./modules/mainhub/pages/people/InvitePerson').then(m => ({ default: m.InvitePerson })));
const MemberApprovals = lazy(() => import('./modules/mainhub/pages/people/MemberApprovals').then(m => ({ default: m.MemberApprovals })));
const MyTeamList = lazy(() => import('./modules/mainhub/pages/people/MyTeamList').then(m => ({ default: m.MyTeamList })));
const GroupSelection = lazy(() => import('./modules/mainhub/pages/people/GroupSelection').then(m => ({ default: m.GroupSelection })));
const Reports = lazy(() => import('./modules/mainhub/pages/Reports').then(m => ({ default: m.Reports })));
const MasterDashboard = lazy(() => import('./modules/mainhub/pages/MasterDashboard').then(m => ({ default: m.MasterDashboard })));
const PastorDashboard = lazy(() => import('./modules/mainhub/pages/PastorDashboard').then(m => ({ default: m.PastorDashboard })));
const ChurchList = lazy(() => import('./modules/mainhub/pages/people/ChurchList').then(m => ({ default: m.ChurchList })));
const ChurchEditor = lazy(() => import('./modules/mainhub/pages/people/ChurchEditor').then(m => ({ default: m.ChurchEditor })));
const AreaList = lazy(() => import('./modules/mainhub/pages/people/AreaList').then(m => ({ default: m.AreaList })));
const AreaSetup = lazy(() => import('./modules/mainhub/pages/people/AreaSetup').then(m => ({ default: m.AreaSetup })));
const TeamSetup = lazy(() => import('./modules/mainhub/pages/people/TeamSetup').then(m => ({ default: m.TeamSetup })));
const ChurchSelect = lazy(() => import('./modules/mainhub/pages/people/ChurchSelect').then(m => ({ default: m.ChurchSelect })));
const ConsolidationDashboard = lazy(() => import('./modules/mainhub/pages/consolidation/ConsolidationDashboard').then(m => ({ default: m.ConsolidationDashboard })));
const AttendanceEntry = lazy(() => import('./modules/mainhub/pages/consolidation/AttendanceEntry').then(m => ({ default: m.AttendanceEntry })));
const VisitorProfile = lazy(() => import('./modules/mainhub/pages/consolidation/VisitorProfile').then(m => ({ default: m.VisitorProfile })));
const PermissionsManager = lazy(() => import('./pages/admin/PermissionsManager').then(m => ({ default: m.PermissionsManager })));

// Social Module
const SocialDashboard = lazy(() => import('./modules/social/pages/SocialDashboard').then(m => ({ default: m.SocialDashboard })));

const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Pricing = lazy(() => import('./pages/Pricing').then(m => ({ default: m.Pricing })));

// Error Pages
const NotFound = lazy(() => import('./pages/errors/NotFound').then(m => ({ default: m.NotFound })));
const ServerError = lazy(() => import('./pages/errors/ServerError').then(m => ({ default: m.ServerError })));
const ServiceUnavailable = lazy(() => import('./pages/errors/ServiceUnavailable').then(m => ({ default: m.ServiceUnavailable })));
const Unauthorized = lazy(() => import('./pages/errors/Unauthorized').then(m => ({ default: m.Unauthorized })));

const LoadingFallback: FC = () => (
  <div className="flex-center w-full" style={{ height: '100vh' }}>
    <div className="spinner"></div>
  </div>
);

const App: FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <TutorialProvider>
          <ToastProvider>
            <ConfirmProvider>
            {import.meta.env.DEV && <DevProfileSelector />}
            <BrowserRouter>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Public Routes */}
                  <Route index element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/auth/google/callback" element={<GoogleCallback />} />
                  <Route path="/accept-invite" element={<AcceptInvite />} />

                  <Route element={<ProtectedRoute />}>
                    <Route element={<MainLayout />}>
                      {/* Global / Selection Dashboard */}
                      <Route path="dashboard" element={<MainDashboard />} />
                      <Route path="profile" element={<Profile />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="settings/invitations" element={<InvitationSettings />} />
                      <Route path="privacy" element={<PrivacySupport />} />

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
                        <Route path="my-team" element={<MyTeamList />} />
                        <Route path="reports" element={<Reports />} />
                        <Route path="master" element={<MasterDashboard />} />
                        <Route path="pastor" element={<PastorDashboard />} />
                        <Route path="consolidation" element={<ConsolidationDashboard />} />
                        <Route path="consolidation/attendance/:meetingId" element={<AttendanceEntry />} />
                        <Route path="consolidation/visitor/:visitorId" element={<VisitorProfile />} />
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
                      <Route path="ushers/*" element={<Navigate to="/mainhub/consolidation" replace />} />
                    </Route>
                  </Route>

                  <Route path="/500" element={<ServerError />} />
                  <Route path="/503" element={<ServiceUnavailable />} />
                  <Route path="/403" element={<Unauthorized />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
            </ConfirmProvider>
          </ToastProvider>
        </TutorialProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
