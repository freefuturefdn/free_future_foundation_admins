import { useAuth } from '../context/AuthContext';
import { canAccessModule } from '../lib/permissions';
import {
  CalendarDateFill, Images, Newspaper, MicFill, HeartFill,
  EnvelopePaperFill, PersonBadgeFill, PeopleFill, ShieldLock, Mailbox,
  JournalText
} from 'react-bootstrap-icons';

const modules = [
  { key: 'accounts', label: 'Accounts', icon: <PeopleFill />, path: '/dashboard/accounts' },
  { key: 'board', label: 'Board Members', icon: <PersonBadgeFill />, path: '/dashboard/board' },
  { key: 'events', label: 'Events', icon: <CalendarDateFill />, path: '/dashboard/events' },
  { key: 'gallery', label: 'Gallery', icon: <Images />, path: '/dashboard/gallery' },
  { key: 'news', label: 'News', icon: <Newspaper />, path: '/dashboard/news' },
  { key: 'team', label: 'Team Members', icon: <PersonBadgeFill />, path: '/dashboard/team' },
  { key: 'volunteers', label: 'Volunteers', icon: <PeopleFill />, path: '/dashboard/volunteers' },
  { key: 'podcasts', label: 'Podcasts', icon: <MicFill />, path: '/dashboard/podcasts' },
  { key: 'donations', label: 'Donations', icon: <HeartFill />, path: '/dashboard/donations' },
  { key: 'partnerships', label: 'Partnerships', icon: <EnvelopePaperFill />, path: '/dashboard/partnerships' },
  { key: 'newsletter', label: 'Newsletter', icon: <Mailbox />, path: '/dashboard/newsletter' },
  { key: 'articles', label: 'Articles', icon: <JournalText />, path: '/dashboard/articles' },
];

export function DashboardHome() {
  const { accountType, session } = useAuth();

  const available = modules.filter(m => canAccessModule(accountType, m.key));

  return (
    <div className="container-fluid p-4">
      <div className="d-flex align-items-center gap-2 mb-4">
        <h3 className="mb-0 text-primary">Welcome back</h3>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <p className="text-muted small mb-1">Signed in as</p>
              <p className="fw-bold mb-0 text-truncate">{session?.user?.email}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <p className="text-muted small mb-1">Account type</p>
              <p className="fw-bold mb-0 text-primary text-uppercase">{accountType?.replaceAll('_', ' ') ?? 'Unknown'}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <p className="text-muted small mb-1">Available modules</p>
              <p className="fw-bold mb-0">{available.length}</p>
            </div>
          </div>
        </div>
      </div>

      <h5 className="text-primary mb-3">Quick access</h5>
      <div className="row g-3">
        {available.map(m => (
          <div key={m.key} className="col-6 col-md-4 col-lg-3">
            <a href={m.path} className="card border-0 shadow-sm text-decoration-none h-100 dashboard-quick-card">
              <div className="card-body text-center py-4">
                <div className="mb-2 text-primary" style={{ fontSize: '1.5rem' }}>{m.icon}</div>
                <p className="mb-0 fw-semibold text-primary">{m.label}</p>
              </div>
            </a>
          </div>
        ))}
      </div>

      <div className="card border-0 shadow-sm mt-4 bg-primary text-white">
        <div className="card-body">
          <h6 className="mb-2">Security reminders</h6>
          <ul className="small mb-0">
            <li>Operate only on trusted networks and devices.</li>
            <li>All actions are logged; report suspicious activity immediately.</li>
            <li>Use strong passwords; reset handled by CEO/admin only.</li>
            <li>Volunteers are organized by year — always verify the correct year.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
