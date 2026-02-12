import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { supabase } from '../lib/supabaseClient';
import { can } from '../lib/permissions';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, PencilSquare, Trash } from 'react-bootstrap-icons';

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  author: string;
  summary: string;
  content: string;
  image_url: string;
  category: string;
  published_at: string;
}

const emptyForm = { title: '', slug: '', author: '', summary: '', content: '', image_url: '', category: '' };

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

export function NewsPage() {
  const { accountType } = useAuth();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('news').select('*').order('published_at', { ascending: false });
    if (error) setError(error.message);
    else setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (n: NewsItem) => {
    setEditing(n);
    setForm({ title: n.title, slug: n.slug, author: n.author, summary: n.summary, content: n.content, image_url: n.image_url, category: n.category });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    const payload = { ...form, slug: form.slug || slugify(form.title) };
    if (editing) {
      const { error } = await supabase.from('news').update(payload).eq('id', editing.id);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.from('news').insert(payload);
      if (error) setError(error.message);
    }
    setSaving(false); setShowModal(false); fetch_();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this news article?')) return;
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (error) setError(error.message);
    fetch_();
  };

  if (!can(accountType, 'news', 'read')) return <div className="container-fluid p-4"><Alert variant="danger">Access denied.</Alert></div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="text-primary mb-0">News</h4>
        {can(accountType, 'news', 'create') && (
          <Button variant="primary" size="sm" onClick={openCreate} className="d-flex align-items-center gap-2"><PlusCircle /> Add Article</Button>
        )}
      </div>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {loading ? <Spinner animation="border" variant="primary" /> : (
        <div className="card border-0 shadow-sm">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr><th>Title</th><th>Author</th><th>Category</th><th>Published</th><th style={{ width: '120px' }}>Actions</th></tr>
            </thead>
            <tbody>
              {items.map(n => (
                <tr key={n.id}>
                  <td className="fw-semibold">{n.title}</td>
                  <td>{n.author}</td>
                  <td>{n.category}</td>
                  <td className="small">{new Date(n.published_at).toLocaleDateString()}</td>
                  <td>
                    <div className="d-flex gap-1">
                      {can(accountType, 'news', 'update') && <Button variant="outline-primary" size="sm" onClick={() => openEdit(n)}><PencilSquare /></Button>}
                      {can(accountType, 'news', 'delete') && <Button variant="outline-danger" size="sm" onClick={() => handleDelete(n.id)}><Trash /></Button>}
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} className="text-center text-muted py-4">No news articles found.</td></tr>}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0"><Modal.Title className="text-primary">{editing ? 'Edit' : 'Create'} News</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="row g-3">
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Title</Form.Label><Form.Control value={form.title} onChange={e => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })} required /></Form.Group></div>
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Slug</Form.Label><Form.Control value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} /></Form.Group></div>
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Author</Form.Label><Form.Control value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} required /></Form.Group></div>
            <div className="col-md-6"><Form.Group><Form.Label className="fw-semibold">Category</Form.Label><Form.Control value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required /></Form.Group></div>
            <div className="col-12"><Form.Group><Form.Label className="fw-semibold">Summary</Form.Label><Form.Control as="textarea" rows={2} value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} required /></Form.Group></div>
            <div className="col-12"><Form.Group><Form.Label className="fw-semibold">Content</Form.Label><Form.Control as="textarea" rows={5} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required /></Form.Group></div>
            <div className="col-12"><Form.Group><Form.Label className="fw-semibold">Image URL</Form.Label><Form.Control value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} required /></Form.Group></div>
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
