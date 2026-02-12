import { useMemo } from 'react';
import { ShieldLock, Check2Circle, BoxArrowRight } from 'react-bootstrap-icons';
import { useAuth } from '../context/AuthContext';
import type { AccountType } from '../lib/supabaseClient';

interface ActionGroup {
  title: string;
  actions: string[];
}

const roleActions: Record<AccountType, ActionGroup[]> = {
  super_admin: [
    { title: 'Accounts', actions: ['Create all accounts', 'Update any account', 'Delete any account', 'Reset passwords'] },
    { title: 'Board', actions: ['Add board members', 'Update board members', 'Delete board members'] },
    { title: 'Events', actions: ['Create events', 'Update events', 'Delete events'] },
    { title: 'Gallery', actions: ['Add images/videos', 'Update media', 'Delete media'] },
    { title: 'News', actions: ['Create news', 'Update news', 'Delete news'] },
    { title: 'Team', actions: ['Create team members', 'Update team members', 'Delete team members'] },
    { title: 'Volunteers', actions: ['Create volunteers (by year)', 'Update volunteers', 'Delete volunteers'] },
    { title: 'Partnerships', actions: ['View partnership inquiries'] },
    { title: 'Podcasts', actions: ['Upload podcasts', 'Update podcasts', 'Delete podcasts'] },
    { title: 'Donations', actions: ['View donations'] },
    { title: 'Newsletter', actions: ['View subscribers', 'Export CSV'] },
  ],
  admin: [
    { title: 'Accounts', actions: ['Create team members and managers', 'Update team members and managers', 'Reset passwords for team and managers'] },
    { title: 'Events', actions: ['Create events', 'Update events', 'Delete events'] },
    { title: 'Gallery', actions: ['Add images/videos', 'Update media', 'Delete media'] },
    { title: 'News', actions: ['Create news', 'Update news', 'Delete news'] },
    { title: 'Team', actions: ['Create team members', 'Update team members', 'Delete team members'] },
    { title: 'Volunteers', actions: ['Create volunteers (by year)', 'Update volunteers', 'Delete volunteers'] },
    { title: 'Partnerships', actions: ['View partnership inquiries'] },
    { title: 'Podcasts', actions: ['Upload podcasts', 'Update podcasts', 'Delete podcasts'] },
    { title: 'Donations', actions: ['View donations'] },
    { title: 'Newsletter', actions: ['View subscribers', 'Export CSV'] },
  ],
  team_member: [
    { title: 'Events', actions: ['Create events', 'Update events', 'Delete events'] },
    { title: 'Gallery', actions: ['Add images/videos'] },
    { title: 'News', actions: ['Create news', 'Update news', 'Delete news'] },
    { title: 'Volunteers', actions: ['Create volunteers (by year)', 'Update volunteers', 'Delete volunteers'] },
    { title: 'Partnerships', actions: ['View partnership inquiries'] },
    { title: 'Podcasts', actions: ['Upload podcasts', 'Update podcasts', 'Delete podcasts'] },
    { title: 'Donations', actions: ['View donations'] },
  ],
  manager: [
    { title: 'Events', actions: ['Create events', 'Update events'] },
    { title: 'Gallery', actions: ['Add images/videos', 'Update media'] },
    { title: 'News', actions: ['Create news', 'Update news'] },
    { title: 'Podcasts', actions: ['Upload podcasts', 'Update podcasts'] },
  ],
};

function ActionCard({ group }: { group: ActionGroup }) {
  return (
    <div className="card h-100 shadow-sm border-0">
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-3 text-primary">
          <Check2Circle />
          <h6 className="mb-0">{group.title}</h6>
        </div>
        <ul className="list-unstyled mb-0 d-grid gap-2">
          {group.actions.map((action) => (
            <li key={action} className="d-flex align-items-center gap-2 text-muted small">
              <span className="badge bg-light text-primary border">{group.title.slice(0, 1)}</span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { accountType, logout, session } = useAuth();
  const groups = useMemo(() => (accountType ? roleActions[accountType] : []), [accountType]);

  return (
    <div className="page-wrapper d-flex flex-column min-vh-100">
      <header className="py-3 border-bottom bg-white">
        <div className="container d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2 text-primary fw-bold">
            <span>Free Future Foundation Admin</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="text-muted small">{session?.user?.email}</span>
            <button className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2" onClick={logout}>
              <BoxArrowRight size={16} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow-1 d-flex align-items-stretch">
        <div className="container my-5">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
            <div>
              <p className="text-uppercase small fw-semibold letter-spacing-1 mb-1">Role</p>
              <h3 className="fw-bold text-primary mb-1">{accountType ?? 'No role found'}</h3>
              <p className="text-muted small mb-0">Actions available to your role based on policy.</p>
            </div>
            <div className="alert alert-info mb-0">
              Volunteers are organized by year. Ensure you select the correct year when managing volunteer records.
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="alert alert-danger">No account type found. Contact an admin.</div>
          ) : (
            <div className="row g-3">
              {groups.map((group) => (
                <div key={group.title} className="col-12 col-md-6 col-lg-4">
                  <ActionCard group={group} />
                </div>
              ))}
            </div>
          )}

          <div className="card border-0 shadow-sm mt-4">
            <div className="card-body">
              <h6 className="text-primary mb-2">Security reminders</h6>
              <ul className="text-muted small mb-0">
                <li>Operate only on trusted networks and devices.</li>
                <li>All actions are logged; report suspicious activity immediately.</li>
                <li>Use strong passwords; reset handled by CEO/admin only.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
