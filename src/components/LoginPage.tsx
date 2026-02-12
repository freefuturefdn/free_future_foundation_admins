import { FormEvent, useState } from 'react';
import { ShieldLock, EnvelopeFill, LockFill, BoxArrowInRight } from 'react-bootstrap-icons';
import { useAuth } from '../context/AuthContext';

const mission = `Our mission is to inspire and equip young Africans to become informed, courageous leaders who advance freedom, justice, and human dignity.
Through transformative education and purposeful campaigns, we champion knowledge, civic engagement, and meaningful collaboration with policymakers and partner organizations. Rooted in the values of freedom and justice, our work empowers a new generation to drive lasting, positive change by shaping policies and communities that reflect these ideals.`;

export function LoginPage() {
  const { login, error, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [info, setInfo] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInfo('');
    await login(email, password);
    setInfo('For security, login is restricted to authorized staff. Ensure you are on a trusted device.');
  };

  return (
    <div className="page-wrapper d-flex flex-column min-vh-100">
      <header className="py-3 border-bottom bg-white">
        <div className="container d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2 text-primary fw-bold">
            <ShieldLock size={28} />
            <span>Free Future Foundation Admin</span>
          </div>
          <div className="text-muted small">Security-first access portal</div>
        </div>
      </header>

      <main className="flex-grow-1 d-flex align-items-stretch">
        <div className="container my-5">
          <div className="row g-4 align-items-stretch">
            <div className="col-12 col-lg-5">
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-2 mb-3 text-primary">
                    <ShieldLock size={24} />
                    <h5 className="mb-0">Secure Sign In</h5>
                  </div>
                  <p className="text-muted small mb-4">
                    Only authorized super_admins, admins, team members, and managers may sign in. Ensure you are on a trusted network.
                  </p>
                  <form onSubmit={handleSubmit} className="d-grid gap-3">
                    <div>
                      <label htmlFor="email" className="form-label fw-semibold text-primary">Email address</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0"><EnvelopeFill /></span>
                        <input
                          id="email"
                          type="email"
                          className="form-control border-start-0"
                          placeholder="you@freefuture.org"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="password" className="form-label fw-semibold text-primary">Password</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0"><LockFill /></span>
                        <input
                          id="password"
                          type="password"
                          className="form-control border-start-0"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary d-flex align-items-center justify-content-center gap-2" disabled={loading}>
                      <BoxArrowInRight />
                      {loading ? 'Signing in...' : 'Sign in securely'}
                    </button>
                  </form>
                  <div className="alert alert-warning mt-3 mb-1 small" role="alert">
                    Forgot password? For security, contact the CEO or an admin to reset your credentials.
                  </div>
                  {error && (
                    <div className="alert alert-danger mt-2 small" role="alert">
                      {error}
                    </div>
                  )}
                  {info && !error && (
                    <div className="alert alert-info mt-2 small" role="status">
                      {info}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-7">
              <div className="card h-100 border-0 bg-primary text-white shadow-sm">
                <div className="card-body p-4 d-flex flex-column justify-content-center">
                  <p className="text-uppercase small fw-semibold letter-spacing-1 mb-2">Our mission</p>
                  <h2 className="fw-bold mb-3">Inspiring courageous African leaders</h2>
                  <p className="lead" style={{ whiteSpace: 'pre-line' }}>
                    {mission}
                  </p>
                  <div className="mt-4">
                    <div className="d-flex align-items-center gap-2">
                      <div className="security-dot" />
                      <span className="fw-semibold">Security is our core commitment.</span>
                    </div>
                    <p className="mb-0 mt-2 opacity-75 small">Access is monitored and limited to authorized personnel. All actions are logged.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="banner text-center py-3 px-2">
        <div className="container fw-semibold">
          This website is strictly for Free Future Foundation staffs, admins and other authorised persons
        </div>
      </footer>
    </div>
  );
}
