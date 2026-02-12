import { useEffect, useState } from 'react';
import { Table, Spinner, Alert } from 'react-bootstrap';
import { supabase } from '../lib/supabaseClient';
import { can } from '../lib/permissions';
import { useAuth } from '../context/AuthContext';

interface Inquiry {
  id: number;
  organization_name: string;
  contact_name: string;
  email: string;
  phone: string;
  organization_type: string;
  partnership_type: string;
  message: string;
  created_at: string;
}

export function PartnershipsPage() {
  const { accountType } = useAuth();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('partnership_inquiries').select('*').order('created_at', { ascending: false });
      if (error) setError(error.message);
      else setItems(data ?? []);
      setLoading(false);
    })();
  }, []);

  if (!can(accountType, 'partnerships', 'read')) return <div className="container-fluid p-4"><Alert variant="danger">Access denied.</Alert></div>;

  return (
    <div className="container-fluid p-4">
      <h4 className="text-primary mb-4">Partnership Inquiries</h4>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {loading ? <Spinner animation="border" variant="primary" /> : (
        <div className="card border-0 shadow-sm">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr><th>Organization</th><th>Contact</th><th>Email</th><th>Phone</th><th>Org Type</th><th>Partnership</th><th>Message</th><th>Date</th></tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id}>
                  <td className="fw-semibold">{i.organization_name}</td>
                  <td>{i.contact_name}</td>
                  <td>{i.email}</td>
                  <td>{i.phone}</td>
                  <td>{i.organization_type}</td>
                  <td>{i.partnership_type}</td>
                  <td className="text-truncate" style={{ maxWidth: '200px' }}>{i.message}</td>
                  <td className="small">{new Date(i.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={8} className="text-center text-muted py-4">No partnership inquiries found.</td></tr>}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
}
