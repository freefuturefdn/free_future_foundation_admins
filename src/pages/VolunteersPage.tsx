import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { supabase } from '../lib/supabaseClient';
import { can } from '../lib/permissions';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, PencilSquare, Trash } from 'react-bootstrap-icons';

interface Volunteer {
  id: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  interests: string[];
  experience: string;
  availability: string;
  agree_to_terms: boolean;
  created_at: string;
}

const emptyForm = { name: '', email: '', phone: '', location: '', interests: '', experience: '', availability: '', agree_to_terms: true };

export function VolunteersPage() {
  const { accountType } = useAuth();
  const [items, setItems] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Volunteer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const years: number[] = [];
  for (let y = new Date().getFullYear(); y >= 2020; y--) years.push(y);

  const fetch_ = async () => {
    setLoading(true);
    const startOfYear = `${selectedYear}-01-01T00:00:00Z`;
    const endOfYear = `${selectedYear}-12-31T23:59:59Z`;
    const { data, error } = await supabase.from('volunteers').select('*')
      .gte('created_at', startOfYear)
      .lte('created_at', endOfYear)
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, [selectedYear]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (v: Volunteer) => {
    setEditing(v);
    setForm({
      name: v.name, email: v.email, phone: v.phone, location: v.location,
      interests: (v.interests ?? []).join(', '), experience: v.experience,
      availability: v.availability, agree_to_terms: v.agree_to_terms,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    const payload = {
      name: form.name, email: form.email, phone: form.phone, location: form.location,
      interests: form.interests.split(',').map(s => s.trim()).filter(Boolean),
      experience: form.experience, availability: form.availability, agree_to_terms: form.agree_to_terms,
    };
    if (editing) {
      const { error } = await supabase.from('volunteers').update(payload).eq('id', editing.id);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.from('volunteers').insert(payload);
      if (error) setError(error.message);
    }
    setSaving(false); setShowModal(false); fetch_();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this volunteer?')) return;
    const { error } = await supabase.from('volunteers').delete().eq('id', id);
    if (error) setError(error.message);
    fetch_();
  };

  if (!can(accountType, 'volunteers', 'read')) return <div className="container-fluid p-4"><Alert variant="danger">Access denied.</Alert></div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 className="text-primary mb-0">Volunteers</h4>
        <div className="d-flex align-items-center gap-2">
          <Form.Select size="sm" style={{ width: '120px' }} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </Form.Select>
          {can(accountType, 'volunteers', 'create') && (
            <Button variant="primary" size="sm" onClick={openCreate} className="d-flex align-items-center gap-2"><PlusCircle /> Add Volunteer</Button>
          )}
        </div>
      </div>
      <Alert variant="info" className="small">Volunteers are organized by year. Select a year above to filter records for the main website display.</Alert>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {loading ? <Spinner animation="border" variant="primary" /> : (
        <div className="card border-0 shadow-sm">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Location</th><th>Availability</th><th>Created</th><th style={{ width: '120px' }}>Actions</th></tr>
            </thead>
            <tbody>
              {items.map(v => (
                <tr key={v.id}>
                  <td className="fw-semibold">{v.name}</td>
                  <td>{v.email}</td>
                  <td>{v.phone}</td>
                  <td>{v.location}</td>
                  <td>{v.availability}</td>
                  <td className="small">{new Date(v.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="d-flex gap-1">
                      {can(accountType, 'volunteers', 'update') && <Button variant="outline-primary" size="sm" onClick={() => openEdit(v)}><PencilSquare /></Button>}
                      {can(accountType, 'volunteers', 'delete') && <Button variant="outline-danger" size="sm" onClick={() => handleDelete(v.id)}><Trash /></Button>}
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={7} className="text-center text-muted py-4">No volunteers found for {selectedYear}.</td></tr>}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0"><Modal.Title className="text-primary">{editing ? 'Edit' : 'Add'} Volunteer</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="row g-3">
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Name</Form.Label><Form.Control value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></Form.Group></div>
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Email</Form.Label><Form.Control type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></Form.Group></div>
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Phone</Form.Label><Form.Control value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required /></Form.Group></div>
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Location</Form.Label><Form.Control value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required /></Form.Group></div>
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Availability</Form.Label><Form.Control value={form.availability} onChange={e => setForm({ ...form, availability: e.target.value })} required /></Form.Group></div>
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Interests (comma-separated)</Form.Label><Form.Control value={form.interests} onChange={e => setForm({ ...form, interests: e.target.value })} required /></Form.Group></div>
            <div className="col-12"><Form.Group><Form.Label className="fw-semibold">Experience</Form.Label><Form.Control as="textarea" rows={3} value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} required /></Form.Group></div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !form.name}>{saving ? 'Saving...' : 'Save'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
