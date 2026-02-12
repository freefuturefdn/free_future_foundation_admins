import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import { supabase } from '../lib/supabaseClient';
import { can } from '../lib/permissions';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, PencilSquare, Trash } from 'react-bootstrap-icons';

interface Podcast {
  id: number;
  title: string;
  description: string;
  episode_number: number;
  category: string;
  image_url: string | null;
  audio_url: string;
  duration: string;
  host: string;
  guests: string[];
  published_at: string;
  featured: boolean;
  listen_count: number;
}

const emptyForm = {
  title: '', description: '', episode_number: 1, category: '',
  image_url: '', audio_url: '', duration: '', host: '', guests: '', featured: false,
};

export function PodcastsPage() {
  const { accountType } = useAuth();
  const [items, setItems] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Podcast | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('podcasts').select('*').order('episode_number', { ascending: false });
    if (error) setError(error.message);
    else setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (p: Podcast) => {
    setEditing(p);
    setForm({
      title: p.title, description: p.description, episode_number: p.episode_number,
      category: p.category, image_url: p.image_url ?? '', audio_url: p.audio_url,
      duration: p.duration, host: p.host, guests: (p.guests ?? []).join(', '), featured: p.featured,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    const payload = {
      title: form.title, description: form.description, episode_number: form.episode_number,
      category: form.category, image_url: form.image_url || null, audio_url: form.audio_url,
      duration: form.duration, host: form.host,
      guests: form.guests.split(',').map(s => s.trim()).filter(Boolean),
      featured: form.featured,
    };
    if (editing) {
      const { error } = await supabase.from('podcasts').update(payload).eq('id', editing.id);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.from('podcasts').insert(payload);
      if (error) setError(error.message);
    }
    setSaving(false); setShowModal(false); fetch_();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this podcast?')) return;
    const { error } = await supabase.from('podcasts').delete().eq('id', id);
    if (error) setError(error.message);
    fetch_();
  };

  if (!can(accountType, 'podcasts', 'read')) return <div className="container-fluid p-4"><Alert variant="danger">Access denied.</Alert></div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="text-primary mb-0">Podcasts</h4>
        {can(accountType, 'podcasts', 'create') && (
          <Button variant="primary" size="sm" onClick={openCreate} className="d-flex align-items-center gap-2"><PlusCircle /> Upload Podcast</Button>
        )}
      </div>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {loading ? <Spinner animation="border" variant="primary" /> : (
        <div className="card border-0 shadow-sm">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr><th>Ep #</th><th>Title</th><th>Host</th><th>Category</th><th>Duration</th><th>Listens</th><th style={{ width: '120px' }}>Actions</th></tr>
            </thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id}>
                  <td><Badge bg="primary">{p.episode_number}</Badge></td>
                  <td className="fw-semibold">{p.title} {p.featured && <Badge bg="warning" text="dark" className="ms-1">Featured</Badge>}</td>
                  <td>{p.host}</td>
                  <td>{p.category}</td>
                  <td>{p.duration}</td>
                  <td>{p.listen_count}</td>
                  <td>
                    <div className="d-flex gap-1">
                      {can(accountType, 'podcasts', 'update') && <Button variant="outline-primary" size="sm" onClick={() => openEdit(p)}><PencilSquare /></Button>}
                      {can(accountType, 'podcasts', 'delete') && <Button variant="outline-danger" size="sm" onClick={() => handleDelete(p.id)}><Trash /></Button>}
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={7} className="text-center text-muted py-4">No podcasts found.</td></tr>}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0"><Modal.Title className="text-primary">{editing ? 'Edit' : 'Upload'} Podcast</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="row g-3">
            <div className="col-md-8"><Form.Group><Form.Label className="fw-semibold">Title</Form.Label><Form.Control value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></Form.Group></div>
            <div className="col-md-4"><Form.Group><Form.Label className="fw-semibold">Episode #</Form.Label><Form.Control type="number" value={form.episode_number} onChange={e => setForm({ ...form, episode_number: Number(e.target.value) })} required /></Form.Group></div>
            <div className="col-12"><Form.Group><Form.Label className="fw-semibold">Description</Form.Label><Form.Control as="textarea" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></Form.Group></div>
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Host</Form.Label><Form.Control value={form.host} onChange={e => setForm({ ...form, host: e.target.value })} required /></Form.Group></div>
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Category</Form.Label><Form.Control value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required /></Form.Group></div>
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Audio URL</Form.Label><Form.Control value={form.audio_url} onChange={e => setForm({ ...form, audio_url: e.target.value })} required /></Form.Group></div>
            <div className="col-md-3"><Form.Group><Form.Label className="fw-semibold">Duration</Form.Label><Form.Control value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 45:30" required /></Form.Group></div>
            <div className="col-md-3 d-flex align-items-end"><Form.Check type="switch" label="Featured" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} /></div>
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Image URL</Form.Label><Form.Control value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} /></Form.Group></div>
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Guests (comma-separated)</Form.Label><Form.Control value={form.guests} onChange={e => setForm({ ...form, guests: e.target.value })} /></Form.Group></div>
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
