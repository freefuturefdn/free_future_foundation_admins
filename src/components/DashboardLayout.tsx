import { Nav, Button } from 'react-bootstrap';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessModule } from '../lib/permissions';
import { 
  Speedometer2, 
  PeopleFill, 
  CalendarDateFill, 
  Images, 
  Newspaper, 
  MicFill, 
  HeartFill, 
  EnvelopePaperFill,
  PersonBadgeFill,
  BoxArrowRight,
  Mailbox,
  AwardFill,
  CloudFill,
  JournalText,
  QuestionCircleFill
} from 'react-bootstrap-icons';

export function DashboardLayout() {
  const { accountType, logout, session } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const link = (to: string, label: string, icon: React.ReactNode, end = false) => (
    <Nav.Item>
      <NavLink to={to} end={end} className={({ isActive }) => `nav-link d-flex align-items-center gap-2 rounded ${isActive ? 'active bg-primary text-white' : 'link-dark'}`}>
        {icon}
        {label}
      </NavLink>
    </Nav.Item>
  );

  return (
    <div className="d-flex vh-100 bg-light">
      {/* Sidebar */}
      <div className="d-flex flex-column flex-shrink-0 p-3 bg-white text-dark shadow-sm sidebar-scroll" style={{ width: '260px' }}>
        <div className="d-flex align-items-center mb-3 mb-md-0 me-md-auto link-dark text-decoration-none">
          <img src="/colored-logo.png" alt="Free Future Foundation" height={42} className="me-2" />
          <span className=" text-primary">Free Future Foundation Admin Portal</span>
        </div>
        <hr />
        <Nav className="flex-column mb-auto gap-1">
          {link('/dashboard', 'Dashboard', <Speedometer2 />, true)}
          {canAccessModule(accountType, 'accounts') && link('/dashboard/accounts', 'Accounts', <PeopleFill />)}
          {canAccessModule(accountType, 'board') && link('/dashboard/board', 'Board Members', <AwardFill />)}
          {canAccessModule(accountType, 'events') && link('/dashboard/events', 'Events', <CalendarDateFill />)}
          {canAccessModule(accountType, 'volunteers') && link('/dashboard/volunteers', 'Volunteers', <PeopleFill />)}
          {canAccessModule(accountType, 'gallery') && link('/dashboard/gallery', 'Gallery', <Images />)}
          {canAccessModule(accountType, 'news') && link('/dashboard/news', 'News', <Newspaper />)}
          {canAccessModule(accountType, 'podcasts') && link('/dashboard/podcasts', 'Podcasts', <MicFill />)}
          {canAccessModule(accountType, 'donations') && link('/dashboard/donations', 'Donations', <HeartFill />)}
          {canAccessModule(accountType, 'partnerships') && link('/dashboard/partnerships', 'Partnerships', <EnvelopePaperFill />)}
          {canAccessModule(accountType, 'team') && link('/dashboard/team', 'Team', <PersonBadgeFill />)}
          {canAccessModule(accountType, 'newsletter') && link('/dashboard/newsletter', 'Newsletter', <Mailbox />)}
          {canAccessModule(accountType, 'media') && link('/dashboard/media', 'Media', <CloudFill />)}
          {canAccessModule(accountType, 'articles') && link('/dashboard/articles', 'Articles', <JournalText />)}
          {canAccessModule(accountType, 'articles') && link('/dashboard/articles/formatting-guide', 'Articles Guide', <QuestionCircleFill />)}
        </Nav>
        <hr />
        <div className="d-grid">
           <div className="small text-muted mb-2 text-truncate" title={session?.user?.email}>
             {session?.user?.email}
           </div>
           <div className="small fw-bold text-primary mb-2 text-uppercase">
             {accountType?.replaceAll('_', ' ')}
           </div>
           <Button variant="outline-danger" size="sm" onClick={handleLogout} className="d-flex align-items-center justify-content-center gap-2">
             <BoxArrowRight />
             Sign out
           </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 overflow-auto d-flex flex-column">
           <Outlet />
           <footer className="mt-auto py-3 bg-white border-top text-center text-muted small">
            This website is strictly for Free Future Foundation staffs, admins and other authorised persons
           </footer>
      </div>
    </div>
  );
}
