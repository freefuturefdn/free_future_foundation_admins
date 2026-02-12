import { useEffect, useState } from 'react';
import { Table, Button, Spinner, Alert } from 'react-bootstrap';
import { supabase } from '../lib/supabaseClient';
import { can } from '../lib/permissions';
import { useAuth } from '../context/AuthContext';
import { Download } from 'react-bootstrap-icons';

interface Subscriber {
  id: number;
  email: string;
  subscribed_at: string;
}

export function NewsletterPage() {
  const { accountType } = useAuth();
  const [items, setItems] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false });
      if (error) setError(error.message);
      else setItems(data ?? []);
      setLoading(false);
    })();
  }, []);

  const exportCsv = () => {
    const header = 'id,email,subscribed_at';
    const rows = items.map(s => `${s.id},"${s.email}","${s.subscribed_at}"`);
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `newsletter_subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!can(accountType, 'newsletter', 'read')) return <div className="container-fluid p-4"><Alert variant="danger">Access denied.</Alert></div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="text-primary mb-0">Newsletter Subscribers</h4>
        <Button variant="success" size="sm" onClick={exportCsv} className="d-flex align-items-center gap-2" disabled={items.length === 0}>
          <Download /> Export CSV
        </Button>
      </div>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {loading ? <Spinner animation="border" variant="primary" /> : (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0 text-muted small">{items.length} subscriber{items.length !== 1 ? 's' : ''} total</div>
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr><th>#</th><th>Email</th><th>Subscribed</th></tr>
            </thead>
            <tbody>
              {items.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td className="fw-semibold">{s.email}</td>
                  <td className="small">{new Date(s.subscribed_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={3} className="text-center text-muted py-4">No subscribers found.</td></tr>}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}
