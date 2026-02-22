import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Spinner, Alert, Badge } from 'react-bootstrap';
import { supabase } from '../lib/supabaseClient';
import { can } from '../lib/permissions';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, PencilSquare, Trash, Eye } from 'react-bootstrap-icons';

/* ── Types ────────────────────────────────────────────────── */

interface Article {
  id: number;
  title: string;
  slug: string;
  author: string;
  published_at: string | null;
  first_image_url: string;
  second_image_url: string;
  first_content: string;
  second_content: string;
  summary: string;
  created_at: string;
  updated_at: string;
}

interface ArticleForm {
  title: string;
  slug: string;
  author: string;
  summary: string;
  first_content: string;
  second_content: string;
  first_image_url: string;
  second_image_url: string;
  published_at: string;
}

const emptyForm: ArticleForm = {
  title: '',
  slug: '',
  author: '',
  summary: '',
  first_content: '',
  second_content: '',
  first_image_url: '',
  second_image_url: '',
  published_at: '',
};

/* ── Helpers ──────────────────────────────────────────────── */

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function toLocalDatetime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  // Format as YYYY-MM-DDTHH:MM for datetime-local input
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ── Component ────────────────────────────────────────────── */

export function ArticlesPage() {
  const { accountType } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Article | null>(null);
  const [form, setForm] = useState<ArticleForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Preview modal
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);

  /* ── Fetch ────────────────────────────────────────────── */

  const fetchArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('published_at', { ascending: false });

    if (error) setError(error.message);
    else setArticles(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  /* ── Create / Edit handlers ───────────────────────────── */

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (article: Article) => {
    setEditing(article);
    setForm({
      title: article.title,
      slug: article.slug,
      author: article.author,
      summary: article.summary,
      first_content: article.first_content,
      second_content: article.second_content,
      first_image_url: article.first_image_url,
      second_image_url: article.second_image_url,
      published_at: toLocalDatetime(article.published_at),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    const slug = form.slug || slugify(form.title);

    const payload: Record<string, unknown> = {
      title: form.title,
      slug,
      author: form.author,
      summary: form.summary,
      first_content: form.first_content,
      second_content: form.second_content,
      first_image_url: form.first_image_url,
      second_image_url: form.second_image_url,
    };

    // Only include published_at when the user filled it in
    if (form.published_at) {
      payload.published_at = new Date(form.published_at).toISOString();
    }

    if (editing) {
      const { error } = await supabase.from('articles').update(payload).eq('id', editing.id);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.from('articles').insert(payload);
      if (error) setError(error.message);
    }

    setSaving(false);
    setShowModal(false);
    fetchArticles();
  };

  /* ── Delete handler ───────────────────────────────────── */

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) return;
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) setError(error.message);
    fetchArticles();
  };

  /* ── Guard ────────────────────────────────────────────── */

  if (!can(accountType, 'articles', 'read')) {
    return (
      <div className="container-fluid p-4">
        <Alert variant="danger">Access denied.</Alert>
      </div>
    );
  }

  /* ── Render ───────────────────────────────────────────── */

  const isFormValid = form.title && form.author && form.summary && form.first_content && form.second_content && form.first_image_url && form.second_image_url;

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="text-primary mb-0">Articles</h4>
        {can(accountType, 'articles', 'create') && (
          <Button variant="primary" size="sm" onClick={openCreate} className="d-flex align-items-center gap-2">
            <PlusCircle /> New Article
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Table */}
      {loading ? (
        <Spinner animation="border" variant="primary" />
      ) : (
        <div className="card border-0 shadow-sm">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Published</th>
                <th>Updated</th>
                <th style={{ width: '140px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td className="fw-semibold">
                    {a.title}
                    <div className="small text-muted text-truncate" style={{ maxWidth: 300 }}>
                      /{a.slug}
                    </div>
                  </td>
                  <td>{a.author}</td>
                  <td className="small">
                    {a.published_at ? (
                      new Date(a.published_at).toLocaleDateString()
                    ) : (
                      <Badge bg="secondary">Draft</Badge>
                    )}
                  </td>
                  <td className="small">{new Date(a.updated_at).toLocaleDateString()}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        title="Preview"
                        onClick={() => setPreviewArticle(a)}
                      >
                        <Eye />
                      </Button>
                      {can(accountType, 'articles', 'update') && (
                        <Button variant="outline-primary" size="sm" title="Edit" onClick={() => openEdit(a)}>
                          <PencilSquare />
                        </Button>
                      )}
                      {can(accountType, 'articles', 'delete') && (
                        <Button variant="outline-danger" size="sm" title="Delete" onClick={() => handleDelete(a.id)}>
                          <Trash />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    No articles found. Click "New Article" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      )}

      {/* ── Create / Edit Modal ─────────────────────────── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg" scrollable>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="text-primary">{editing ? 'Edit' : 'Create'} Article</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row g-3">
            {/* Title */}
            <div className="col-md-8">
              <Form.Group>
                <Form.Label className="fw-semibold">Title</Form.Label>
                <Form.Control
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                      slug: slugify(e.target.value),
                    })
                  }
                  placeholder="Article title"
                  required
                />
              </Form.Group>
            </div>

            {/* Slug */}
            <div className="col-md-4">
              <Form.Group>
                <Form.Label className="fw-semibold">Slug</Form.Label>
                <Form.Control
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="auto-generated-slug"
                />
                <Form.Text className="text-muted">Leave blank to auto-generate.</Form.Text>
              </Form.Group>
            </div>

            {/* Author */}
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-semibold">Author</Form.Label>
                <Form.Control
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  placeholder="Author name"
                  required
                />
              </Form.Group>
            </div>

            {/* Publish Date */}
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-semibold">Publish Date</Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={form.published_at}
                  onChange={(e) => setForm({ ...form, published_at: e.target.value })}
                />
                <Form.Text className="text-muted">Leave blank to default to now.</Form.Text>
              </Form.Group>
            </div>

            {/* Summary */}
            <div className="col-12">
              <Form.Group>
                <Form.Label className="fw-semibold">Summary</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="Brief summary of the article"
                  required
                />
              </Form.Group>
            </div>

            {/* First Image URL */}
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-semibold">First Image URL</Form.Label>
                <Form.Control
                  value={form.first_image_url}
                  onChange={(e) => setForm({ ...form, first_image_url: e.target.value })}
                  placeholder="https://example.com/image1.jpg"
                  required
                />
                {form.first_image_url && (
                  <img
                    src={form.first_image_url}
                    alt="First preview"
                    className="mt-2 rounded border"
                    style={{ maxHeight: 120, objectFit: 'cover' }}
                    onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                  />
                )}
              </Form.Group>
            </div>

            {/* Second Image URL */}
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-semibold">Second Image URL</Form.Label>
                <Form.Control
                  value={form.second_image_url}
                  onChange={(e) => setForm({ ...form, second_image_url: e.target.value })}
                  placeholder="https://example.com/image2.jpg"
                  required
                />
                {form.second_image_url && (
                  <img
                    src={form.second_image_url}
                    alt="Second preview"
                    className="mt-2 rounded border"
                    style={{ maxHeight: 120, objectFit: 'cover' }}
                    onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                  />
                )}
              </Form.Group>
            </div>

            {/* First Content */}
            <div className="col-12">
              <Form.Group>
                <Form.Label className="fw-semibold">First Content</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={form.first_content}
                  onChange={(e) => setForm({ ...form, first_content: e.target.value })}
                  placeholder="Write the first section of the article..."
                  required
                />
              </Form.Group>
            </div>

            {/* Second Content */}
            <div className="col-12">
              <Form.Group>
                <Form.Label className="fw-semibold">Second Content</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={form.second_content}
                  onChange={(e) => setForm({ ...form, second_content: e.target.value })}
                  placeholder="Write the second section of the article..."
                  required
                />
              </Form.Group>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !isFormValid}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Preview Modal ───────────────────────────────── */}
      <Modal show={!!previewArticle} onHide={() => setPreviewArticle(null)} centered size="lg" scrollable>
        {previewArticle && (
          <>
            <Modal.Header closeButton className="border-0">
              <Modal.Title className="text-primary">{previewArticle.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="mb-2 text-muted small">
                By <strong>{previewArticle.author}</strong>
                {previewArticle.published_at && <> &middot; {new Date(previewArticle.published_at).toLocaleDateString()}</>}
              </div>
              <p className="lead">{previewArticle.summary}</p>
              <hr />
              {previewArticle.first_image_url && (
                <img
                  src={previewArticle.first_image_url}
                  alt="First"
                  className="w-100 rounded mb-3"
                  style={{ maxHeight: 360, objectFit: 'cover' }}
                />
              )}
              <div style={{ whiteSpace: 'pre-wrap' }}>{previewArticle.first_content}</div>
              <hr />
              {previewArticle.second_image_url && (
                <img
                  src={previewArticle.second_image_url}
                  alt="Second"
                  className="w-100 rounded mb-3"
                  style={{ maxHeight: 360, objectFit: 'cover' }}
                />
              )}
              <div style={{ whiteSpace: 'pre-wrap' }}>{previewArticle.second_content}</div>
            </Modal.Body>
            <Modal.Footer className="border-0">
              <Button variant="secondary" onClick={() => setPreviewArticle(null)}>
                Close
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </div>
  );
}
