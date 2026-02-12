import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import { supabase } from '../lib/supabaseClient';
import { can } from '../lib/permissions';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, PencilSquare, Trash } from 'react-bootstrap-icons';

interface GalleryItem {
  id: number;
  title: string;
  description: string;
  image_url: string;
  video_url: string | null;
  type: 'image' | 'video';
  status: string;
  created_at: string;
}

const emptyForm = { title: '', description: '', image_url: '', video_url: '', type: 'image' as 'image' | 'video', status: 'published' };

export function GalleryPage() {
  const { accountType } = useAuth();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (g: GalleryItem) => {
    setEditing(g);
    setForm({ title: g.title, description: g.description, image_url: g.image_url, video_url: g.video_url ?? '', type: g.type, status: g.status });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    const payload = { ...form, video_url: form.video_url || null };
    if (editing) {
      const { error } = await supabase.from('gallery').update(payload).eq('id', editing.id);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.from('gallery').insert(payload);
      if (error) setError(error.message);
    }
    setSaving(false); setShowModal(false); fetch_();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this gallery item?')) return;
    const { error } = await supabase.from('gallery').delete().eq('id', id);
    if (error) setError(error.message);
    fetch_();
  };

  if (!can(accountType, 'gallery', 'read')) return <div className="container-fluid p-4"><Alert variant="danger">Access denied.</Alert></div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="text-primary mb-0">Gallery</h4>
        {can(accountType, 'gallery', 'create') && (
          <Button variant="primary" size="sm" onClick={openCreate} className="d-flex align-items-center gap-2"><PlusCircle /> Add Media</Button>
        )}
      </div>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {loading ? <Spinner animation="border" variant="primary" /> : (
        <div className="card border-0 shadow-sm">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr><th>Title</th><th>Type</th><th>Status</th><th>Created</th><th style={{ width: '120px' }}>Actions</th></tr>
            </thead>
            <tbody>
              {items.map(g => (
                <tr key={g.id}>
                  <td className="fw-semibold">{g.title}</td>
                  <td><Badge bg={g.type === 'image' ? 'info' : 'warning'}>{g.type}</Badge></td>
                  <td><Badge bg={g.status === 'published' ? 'success' : 'secondary'}>{g.status}</Badge></td>
                  <td className="small">{new Date(g.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="d-flex gap-1">
                      {can(accountType, 'gallery', 'update') && <Button variant="outline-primary" size="sm" onClick={() => openEdit(g)}><PencilSquare /></Button>}
                      {can(accountType, 'gallery', 'delete') && <Button variant="outline-danger" size="sm" onClick={() => handleDelete(g.id)}><Trash /></Button>}
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} className="text-center text-muted py-4">No gallery items found.</td></tr>}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0"><Modal.Title className="text-primary">{editing ? 'Edit' : 'Add'} Gallery Item</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="row g-3">
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Title</Form.Label><Form.Control value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></Form.Group></div>
            <div className="col-md-3"><Form.Group><Form.Label className="fw-semibold">Type</Form.Label><Form.Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'image' | 'video' })}><option value="image">Image</option><option value="video">Video</option></Form.Select></Form.Group></div>
            <div className="col-md-3"><Form.Group><Form.Label className="fw-semibold">Status</Form.Label><Form.Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></Form.Select></Form.Group></div>
            <div className="col-12"><Form.Group><Form.Label className="fw-semibold">Description</Form.Label><Form.Control as="textarea" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></Form.Group></div>
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Image URL</Form.Label><Form.Control value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} required /></Form.Group></div>
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Video URL</Form.Label><Form.Control value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} /></Form.Group></div>
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
