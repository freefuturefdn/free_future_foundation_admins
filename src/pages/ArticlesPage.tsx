import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Spinner, Alert, Badge, Tabs, Tab } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import DOMPurify from 'dompurify';
import { supabase } from '../lib/supabaseClient';
import { can } from '../lib/permissions';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, PencilSquare, Trash, Eye, QuestionCircle } from 'react-bootstrap-icons';

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
  content_format?: ContentFormat | null;
  summary: string;
  created_at: string;
  updated_at: string;
}

type ContentFormat = 'plain' | 'markdown' | 'html';
type PublishMode = 'draft' | 'publish_now' | 'schedule';

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
  content_format: ContentFormat;
  publish_mode: PublishMode;
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
  content_format: 'plain',
  publish_mode: 'publish_now',
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

function detectFormat(contentA: string, contentB: string): ContentFormat {
  const content = `${contentA}\n${contentB}`;
  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(content);
  if (hasHtml) return 'html';

  const hasMarkdown = /(^|\n)#{1,6}\s|\*\*[^*]+\*\*|\[[^\]]+\]\([^\)]+\)|(^|\n)-\s|(^|\n)\d+\.\s|```/m.test(content);
  if (hasMarkdown) return 'markdown';

  return 'plain';
}

function renderFormattedContent(content: string, format: ContentFormat) {
  if (format === 'markdown') {
    return (
      <div className="article-rendered-content">
        <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeSanitize]}>{content}</ReactMarkdown>
      </div>
    );
  }

  if (format === 'html') {
    const sanitizedHtml = DOMPurify.sanitize(content, { USE_PROFILES: { html: true } });
    return <div className="article-rendered-content" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
  }

  return <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>;
}

function formatLabel(format: ContentFormat): string {
  if (format === 'markdown') return 'Markdown';
  if (format === 'html') return 'HTML';
  return 'Plain Text';
}

interface ContentEditorProps {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  format: ContentFormat;
}

function ContentEditor({ label, value, onChange, format }: ContentEditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  return (
    <Form.Group>
      <Form.Label className="fw-semibold d-flex justify-content-between align-items-center">
        <span>{label}</span>
        <Badge bg="light" text="dark" className="border">
          {formatLabel(format)}
        </Badge>
      </Form.Label>
      <Tabs activeKey={tab} onSelect={(k) => setTab((k as 'write' | 'preview') || 'write')} className="mb-2" mountOnEnter unmountOnExit>
        <Tab eventKey="write" title="Write">
          <Form.Control
            as="textarea"
            rows={7}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Write ${label.toLowerCase()}...`}
            required
          />
        </Tab>
        <Tab eventKey="preview" title="Preview">
          <div className="border rounded p-3 bg-light article-editor-preview">{renderFormattedContent(value || 'Nothing to preview yet.', format)}</div>
        </Tab>
      </Tabs>
    </Form.Group>
  );
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
      content_format: article.content_format ?? detectFormat(article.first_content, article.second_content),
      publish_mode: article.published_at ? 'schedule' : 'draft',
    });
    setShowModal(true);
  };

  const saveArticle = async (
    data: Record<string, unknown>,
    format: ContentFormat,
    isEditing: boolean,
    articleId?: number,
  ) => {
    const dataWithFormat = { ...data, content_format: format };

    if (isEditing && articleId) {
      let result = await supabase.from('articles').update(dataWithFormat).eq('id', articleId);
      if (result.error && /content_format/i.test(result.error.message)) {
        result = await supabase.from('articles').update(data).eq('id', articleId);
      }
      return result.error;
    }

    let result = await supabase.from('articles').insert(dataWithFormat);
    if (result.error && /content_format/i.test(result.error.message)) {
      result = await supabase.from('articles').insert(data);
    }
    return result.error;
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

    if (form.publish_mode === 'draft') {
      payload.published_at = null;
    } else if (form.publish_mode === 'publish_now') {
      payload.published_at = new Date().toISOString();
    } else if (form.published_at) {
      payload.published_at = new Date(form.published_at).toISOString();
    } else {
      setError('Please choose a publish date and time for scheduled posting.');
      setSaving(false);
      return;
    }

    const saveError = await saveArticle(payload, form.content_format, !!editing, editing?.id);

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
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

  const isFormValid =
    form.title &&
    form.author &&
    form.summary &&
    form.first_content &&
    form.second_content &&
    form.first_image_url &&
    form.second_image_url &&
    (form.publish_mode !== 'schedule' || !!form.published_at);

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="text-primary mb-0">Articles</h4>
        <div className="d-flex align-items-center gap-2">
          <Button as={Link} to="/dashboard/articles/formatting-guide" variant="outline-secondary" size="sm" className="d-flex align-items-center gap-2">
            <QuestionCircle /> Formatting Guide
          </Button>
          {can(accountType, 'articles', 'create') && (
            <Button variant="primary" size="sm" onClick={openCreate} className="d-flex align-items-center gap-2">
              <PlusCircle /> New Post
            </Button>
          )}
        </div>
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
                <th>Format</th>
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
                  <td>
                    <Badge bg="light" text="dark" className="border">
                      {formatLabel(a.content_format ?? detectFormat(a.first_content, a.second_content))}
                    </Badge>
                  </td>
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
                  <td colSpan={6} className="text-center text-muted py-4">
                    No articles found. Click "New Post" to create one.
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
                <Form.Label className="fw-semibold">Posting</Form.Label>
                <Form.Select
                  value={form.publish_mode}
                  onChange={(e) => setForm({ ...form, publish_mode: e.target.value as PublishMode })}
                >
                  <option value="publish_now">Publish now</option>
                  <option value="schedule">Schedule publish date</option>
                  <option value="draft">Save as draft</option>
                </Form.Select>
              </Form.Group>
            </div>

            {/* Content Format */}
            <div className="col-md-6">
              <Form.Group>
                <Form.Label className="fw-semibold">Content Format</Form.Label>
                <Form.Select
                  value={form.content_format}
                  onChange={(e) => setForm({ ...form, content_format: e.target.value as ContentFormat })}
                >
                  <option value="plain">Plain text</option>
                  <option value="markdown">Markdown</option>
                  <option value="html">HTML</option>
                </Form.Select>
                <Form.Text className="text-muted">Choose one format for both content sections in this post.</Form.Text>
              </Form.Group>
            </div>

            {/* Scheduled Publish Date */}
            {form.publish_mode === 'schedule' && (
              <div className="col-12">
                <Form.Group>
                  <Form.Label className="fw-semibold">Publish Date and Time</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    value={form.published_at}
                    onChange={(e) => setForm({ ...form, published_at: e.target.value })}
                    required
                  />
                </Form.Group>
              </div>
            )}

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
              <ContentEditor
                label="First Content"
                value={form.first_content}
                onChange={(nextValue) => setForm({ ...form, first_content: nextValue })}
                format={form.content_format}
              />
            </div>

            {/* Second Content */}
            <div className="col-12">
              <ContentEditor
                label="Second Content"
                value={form.second_content}
                onChange={(nextValue) => setForm({ ...form, second_content: nextValue })}
                format={form.content_format}
              />
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
              {(() => {
                const previewFormat = previewArticle.content_format ?? detectFormat(previewArticle.first_content, previewArticle.second_content);
                return (
                  <div className="mb-2">
                    <Badge bg="light" text="dark" className="border">
                      {formatLabel(previewFormat)}
                    </Badge>
                  </div>
                );
              })()}
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
              {renderFormattedContent(
                previewArticle.first_content,
                previewArticle.content_format ?? detectFormat(previewArticle.first_content, previewArticle.second_content),
              )}
              <hr />
              {previewArticle.second_image_url && (
                <img
                  src={previewArticle.second_image_url}
                  alt="Second"
                  className="w-100 rounded mb-3"
                  style={{ maxHeight: 360, objectFit: 'cover' }}
                />
              )}
              {renderFormattedContent(
                previewArticle.second_content,
                previewArticle.content_format ?? detectFormat(previewArticle.first_content, previewArticle.second_content),
              )}
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
