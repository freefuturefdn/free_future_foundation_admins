import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import { DashboardHome } from './pages/DashboardHome';
import { AccountsPage } from './pages/AccountsPage';
import { BoardPage } from './pages/BoardPage';
import { EventsPage } from './pages/EventsPage';
import { VolunteersPage } from './pages/VolunteersPage';
import { GalleryPage } from './pages/GalleryPage';
import { NewsPage } from './pages/NewsPage';
import { TeamPage } from './pages/TeamPage';
import { PodcastsPage } from './pages/PodcastsPage';
import { DonationsPage } from './pages/DonationsPage';
import { PartnershipsPage } from './pages/PartnershipsPage';
import { NewsletterPage } from './pages/NewsletterPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

function App() {
  const { session } = useAuth();

  return (
    <Routes>
      <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="board" element={<BoardPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="volunteers" element={<VolunteersPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="podcasts" element={<PodcastsPage />} />
        <Route path="donations" element={<DonationsPage />} />
        <Route path="partnerships" element={<PartnershipsPage />} />
        <Route path="newsletter" element={<NewsletterPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
