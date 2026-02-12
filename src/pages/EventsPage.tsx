import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import { supabase } from '../lib/supabaseClient';
import { can } from '../lib/permissions';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, PencilSquare, Trash } from 'react-bootstrap-icons';

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  image_url: string | null;
  registration_url: string | null;
  is_featured: boolean;
  max_attendees: number | null;
  current_attendees: number;
  status: string;
  category: string;
  created_at: string;
}

const emptyForm = {
  title: '', description: '', location: '', start_date: '', end_date: '',
  image_url: '', registration_url: '', is_featured: false,
  max_attendees: '', status: 'upcoming', category: '',
};

export function EventsPage() {
  const { accountType } = useAuth();
  const [items, setItems] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('events').select('*').order('start_date', { ascending: false });
    if (error) setError(error.message);
    else setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (e: Event) => {
    setEditing(e);
    setForm({
      title: e.title, description: e.description, location: e.location,
      start_date: e.start_date?.slice(0, 16) ?? '', end_date: e.end_date?.slice(0, 16) ?? '',
      image_url: e.image_url ?? '', registration_url: e.registration_url ?? '',
      is_featured: e.is_featured, max_attendees: e.max_attendees?.toString() ?? '',
      status: e.status, category: e.category,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    const payload = {
      title: form.title, description: form.description, location: form.location,
      start_date: form.start_date, end_date: form.end_date,
      image_url: form.image_url || null, registration_url: form.registration_url || null,
      is_featured: form.is_featured, max_attendees: form.max_attendees ? Number(form.max_attendees) : null,
      status: form.status, category: form.category,
    };
    if (editing) {
      const { error } = await supabase.from('events').update(payload).eq('id', editing.id);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.from('events').insert(payload);
      if (error) setError(error.message);
    }
    setSaving(false); setShowModal(false); fetch_();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this event?')) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) setError(error.message);
    fetch_();
  };

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = { upcoming: 'primary', ongoing: 'warning', completed: 'success', cancelled: 'danger' };
    return <Badge bg={colors[s] ?? 'secondary'}>{s}</Badge>;
  };

  if (!can(accountType, 'events', 'read')) return <div className="container-fluid p-4"><Alert variant="danger">Access denied.</Alert></div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="text-primary mb-0">Events</h4>
        {can(accountType, 'events', 'create') && (
          <Button variant="primary" size="sm" onClick={openCreate} className="d-flex align-items-center gap-2"><PlusCircle /> Add Event</Button>
        )}
      </div>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {loading ? <Spinner animation="border" variant="primary" /> : (
        <div className="card border-0 shadow-sm">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr><th>Title</th><th>Location</th><th>Date</th><th>Status</th><th>Category</th><th>Attendees</th><th style={{ width: '120px' }}>Actions</th></tr>
            </thead>
            <tbody>
              {items.map(e => (
                <tr key={e.id}>
                  <td className="fw-semibold">{e.title}</td>
                  <td>{e.location}</td>
                  <td className="small">{new Date(e.start_date).toLocaleDateString()}</td>
                  <td>{statusBadge(e.status)}</td>
                  <td>{e.category}</td>
                  <td>{e.current_attendees}{e.max_attendees ? `/${e.max_attendees}` : ''}</td>
                  <td>
                    <div className="d-flex gap-1">
                      {can(accountType, 'events', 'update') && <Button variant="outline-primary" size="sm" onClick={() => openEdit(e)}><PencilSquare /></Button>}
                      {can(accountType, 'events', 'delete') && <Button variant="outline-danger" size="sm" onClick={() => handleDelete(e.id)}><Trash /></Button>}
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={7} className="text-center text-muted py-4">No events found.</td></tr>}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0"><Modal.Title className="text-primary">{editing ? 'Edit' : 'Create'} Event</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="row g-3">
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Title</Form.Label><Form.Control value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></Form.Group></div>
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Category</Form.Label><Form.Control value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required /></Form.Group></div>
            <div className="col-12"><Form.Group><Form.Label className="fw-semibold">Description</Form.Label><Form.Control as="textarea" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></Form.Group></div>
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Location</Form.Label><Form.Control value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required /></Form.Group></div>
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Status</Form.Label><Form.Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></Form.Select></Form.Group></div>
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Start Date</Form.Label><Form.Control type="datetime-local" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required /></Form.Group></div>
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">End Date</Form.Label><Form.Control type="datetime-local" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required /></Form.Group></div>
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Image URL</Form.Label><Form.Control value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} /></Form.Group></div>
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Registration URL</Form.Label><Form.Control value={form.registration_url} onChange={e => setForm({ ...form, registration_url: e.target.value })} /></Form.Group></div>
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Max Attendees</Form.Label><Form.Control type="number" value={form.max_attendees} onChange={e => setForm({ ...form, max_attendees: e.target.value })} /></Form.Group></div>
            <div className="col-md-6 d-flex align-items-end"><Form.Check type="switch" label="Featured" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} /></div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !form.title}>{saving ? 'Saving...' : 'Save'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
