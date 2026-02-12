import { useEffect, useState } from 'react';
import { Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { supabase } from '../lib/supabaseClient';
import { can } from '../lib/permissions';
import { useAuth } from '../context/AuthContext';

interface Donation {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  payment_status: string;
  created_at: string;
}

export function DonationsPage() {
  const { accountType } = useAuth();
  const [items, setItems] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('donations').select('*').order('created_at', { ascending: false });
      if (error) setError(error.message);
      else setItems(data ?? []);
      setLoading(false);
    })();
  }, []);

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = { pending: 'warning', completed: 'success', failed: 'danger' };
    return <Badge bg={colors[s] ?? 'secondary'}>{s}</Badge>;
  };

  if (!can(accountType, 'donations', 'read')) return <div className="container-fluid p-4"><Alert variant="danger">Access denied.</Alert></div>;

  return (
    <div className="container-fluid p-4">
      <h4 className="text-primary mb-4">Donations</h4>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {loading ? <Spinner animation="border" variant="primary" /> : (
        <div className="card border-0 shadow-sm">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Message</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {items.map(d => (
                <tr key={d.id}>
                  <td className="fw-semibold">{d.name}</td>
                  <td>{d.email}</td>
                  <td>{d.phone ?? '—'}</td>
                  <td className="text-truncate" style={{ maxWidth: '200px' }}>{d.message ?? '—'}</td>
                  <td>{statusBadge(d.payment_status)}</td>
                  <td className="small">{new Date(d.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={6} className="text-center text-muted py-4">No donations found.</td></tr>}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}
