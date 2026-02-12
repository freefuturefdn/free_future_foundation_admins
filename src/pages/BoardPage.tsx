import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { supabase } from '../lib/supabaseClient';
import { can } from '../lib/permissions';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, PencilSquare, Trash } from 'react-bootstrap-icons';

interface BoardMember {
  id: number;
  name: string;
  position: string;
  bio: string;
  image_url: string | null;
  social_links: Record<string, string>;
  order_position: number;
}

const empty: Omit<BoardMember, 'id'> = { name: '', position: '', bio: '', image_url: '', social_links: {}, order_position: 0 };

export function BoardPage() {
  const { accountType } = useAuth();
  const [items, setItems] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BoardMember | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const fetch_ = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('board_members').select('*').order('order_position');
    if (error) setError(error.message);
    else setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const openCreate = () => { setEditing(null); setForm(empty); setShowModal(true); };
  const openEdit = (m: BoardMember) => { setEditing(m); setForm({ name: m.name, position: m.position, bio: m.bio, image_url: m.image_url ?? '', social_links: m.social_links, order_position: m.order_position }); setShowModal(true); };

  const handleSave = async () => {
    setSaving(true); setError('');
    const payload = { ...form, social_links: form.social_links, image_url: form.image_url || null };
    if (editing) {
      const { error } = await supabase.from('board_members').update(payload).eq('id', editing.id);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.from('board_members').insert(payload);
      if (error) setError(error.message);
    }
    setSaving(false); setShowModal(false); fetch_();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this board member?')) return;
    const { error } = await supabase.from('board_members').delete().eq('id', id);
    if (error) setError(error.message);
    fetch_();
  };

  if (!can(accountType, 'board', 'read')) return <div className="container-fluid p-4"><Alert variant="danger">Access denied.</Alert></div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="text-primary mb-0">Board Members</h4>
        {can(accountType, 'board', 'create') && (
          <Button variant="primary" size="sm" onClick={openCreate} className="d-flex align-items-center gap-2"><PlusCircle /> Add Member</Button>
        )}
      </div>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {loading ? <Spinner animation="border" variant="primary" /> : (
        <div className="card border-0 shadow-sm">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr><th>Order</th><th>Name</th><th>Position</th><th>Bio</th><th style={{ width: '120px' }}>Actions</th></tr>
            </thead>
            <tbody>
              {items.map(m => (
                <tr key={m.id}>
                  <td>{m.order_position}</td>
                  <td className="fw-semibold">{m.name}</td>
                  <td>{m.position}</td>
                  <td className="text-truncate" style={{ maxWidth: '250px' }}>{m.bio}</td>
                  <td>
                    <div className="d-flex gap-1">
                      {can(accountType, 'board', 'update') && <Button variant="outline-primary" size="sm" onClick={() => openEdit(m)}><PencilSquare /></Button>}
                      {can(accountType, 'board', 'delete') && <Button variant="outline-danger" size="sm" onClick={() => handleDelete(m.id)}><Trash /></Button>}
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} className="text-center text-muted py-4">No board members found.</td></tr>}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0"><Modal.Title className="text-primary">{editing ? 'Edit' : 'Add'} Board Member</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="row g-3">
            <div className="col-md-6">
              <Form.Group><Form.Label className="fw-semibold">Name</Form.Label><Form.Control value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group><Form.Label className="fw-semibold">Position</Form.Label><Form.Control value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} required /></Form.Group>
            </div>
            <div className="col-12">
              <Form.Group><Form.Label className="fw-semibold">Bio</Form.Label><Form.Control as="textarea" rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} required /></Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group><Form.Label className="fw-semibold">Image URL</Form.Label><Form.Control value={form.image_url ?? ''} onChange={e => setForm({ ...form, image_url: e.target.value })} /></Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group><Form.Label className="fw-semibold">Order Position</Form.Label><Form.Control type="number" value={form.order_position} onChange={e => setForm({ ...form, order_position: Number(e.target.value) })} /></Form.Group>
            </div>
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
