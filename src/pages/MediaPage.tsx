import { useEffect, useState, useRef, useCallback } from 'react';
import { Tabs, Tab, Button, Spinner, Alert, Modal, Form, InputGroup } from 'react-bootstrap';
import { supabase } from '../lib/supabaseClient';
import { can } from '../lib/permissions';
import { useAuth } from '../context/AuthContext';
import {
  CloudUpload,
  Trash,
  ClipboardCheck,
  Clipboard,
  PencilSquare,
  FileEarmark,
  FileEarmarkImage,
  FileEarmarkMusic,
  FileEarmarkPlay,
  FileEarmarkPdf,
  Search,
} from 'react-bootstrap-icons';

const BUCKETS = ['books', 'podcasts', 'website-images'] as const;
type BucketName = (typeof BUCKETS)[number];

interface StorageFile {
  name: string;
  id: string | undefined;
  updated_at: string | undefined;
  created_at: string | undefined;
  metadata: { size?: number; mimetype?: string } | null;
}

/* ── helpers ─────────────────────────────────────────────────── */

function humanSize(bytes?: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return <FileEarmarkImage className="text-success" />;
  if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(ext)) return <FileEarmarkMusic className="text-info" />;
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return <FileEarmarkPlay className="text-warning" />;
  if (ext === 'pdf') return <FileEarmarkPdf className="text-danger" />;
  return <FileEarmark className="text-muted" />;
}

function getPublicUrl(bucket: BucketName, fileName: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}

function isPreviewable(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
}

/* ── component ───────────────────────────────────────────────── */

export function MediaPage() {
  const { accountType } = useAuth();
  const [activeBucket, setActiveBucket] = useState<BucketName>('books');
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rename state
  const [renameModal, setRenameModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState<StorageFile | null>(null);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(false);

  // Copied URL tracking
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const canDelete = can(accountType, 'media', 'delete');
  const canRenameBooks = can(accountType, 'media', 'update');

  /* ── fetch files ──────────────────────────────────────────── */

  const fetchFiles = useCallback(async (bucket: BucketName) => {
    setLoading(true);
    setError('');
    const { data, error } = await supabase.storage.from(bucket).list('', {
      limit: 500,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error) {
      setError(error.message);
      setFiles([]);
    } else {
      // filter out the .emptyFolderPlaceholder created by Supabase
      setFiles((data ?? []).filter((f) => f.name !== '.emptyFolderPlaceholder'));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFiles(activeBucket);
    setSearchTerm('');
  }, [activeBucket, fetchFiles]);

  /* ── upload ───────────────────────────────────────────────── */

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    setError('');
    setSuccess('');

    const failures: string[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const { error } = await supabase.storage
        .from(activeBucket)
        .upload(file.name, file, { upsert: false });
      if (error) failures.push(`${file.name}: ${error.message}`);
    }

    if (failures.length > 0) {
      setError(failures.join('\n'));
    } else {
      setSuccess(`${selectedFiles.length} file(s) uploaded successfully.`);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    fetchFiles(activeBucket);
  };

  /* ── delete ───────────────────────────────────────────────── */

  const handleDelete = async (fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;
    setError('');
    const { error } = await supabase.storage.from(activeBucket).remove([fileName]);
    if (error) setError(error.message);
    else setSuccess(`"${fileName}" deleted.`);
    fetchFiles(activeBucket);
  };

  /* ── rename (books only) ──────────────────────────────────── */

  const openRename = (file: StorageFile) => {
    setRenameTarget(file);
    // Pre-fill with current name (without extension)
    const parts = file.name.split('.');
    const ext = parts.length > 1 ? `.${parts.pop()}` : '';
    setNewName(parts.join('.'));
    setRenameModal(true);
  };

  const handleRename = async () => {
    if (!renameTarget || !newName.trim()) return;
    setRenaming(true);
    setError('');

    const ext = renameTarget.name.includes('.')
      ? `.${renameTarget.name.split('.').pop()}`
      : '';
    const destination = `${newName.trim()}${ext}`;

    // Supabase storage doesn't have a rename — we must copy then delete
    const { error: moveError } = await supabase.storage
      .from(activeBucket)
      .move(renameTarget.name, destination);

    if (moveError) {
      setError(moveError.message);
    } else {
      setSuccess(`Renamed to "${destination}".`);
    }

    setRenaming(false);
    setRenameModal(false);
    fetchFiles(activeBucket);
  };

  /* ── copy URL ─────────────────────────────────────────────── */

  const handleCopyUrl = async (fileName: string) => {
    const url = getPublicUrl(activeBucket, fileName);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedFile(fileName);
      setTimeout(() => setCopiedFile(null), 2000);
    } catch {
      // fallback
      prompt('Copy this URL:', url);
    }
  };

  /* ── filtered list ────────────────────────────────────────── */

  const filtered = searchTerm
    ? files.filter((f) => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : files;

  /* ── render ───────────────────────────────────────────────── */

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 className="text-primary mb-0">Media Library</h4>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="d-none"
            multiple
            onChange={handleUpload}
          />
          <Button
            variant="primary"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="d-flex align-items-center gap-2"
          >
            {uploading ? <Spinner animation="border" size="sm" /> : <CloudUpload />}
            {uploading ? 'Uploading…' : 'Upload Files'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} style={{ whiteSpace: 'pre-line' }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <Tabs
            activeKey={activeBucket}
            onSelect={(k) => k && setActiveBucket(k as BucketName)}
            className="px-3 pt-3"
          >
            {BUCKETS.map((b) => (
              <Tab
                key={b}
                eventKey={b}
                title={b.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              />
            ))}
          </Tabs>

          {/* Search */}
          <div className="px-3 pt-3">
            <InputGroup size="sm" style={{ maxWidth: 350 }}>
              <InputGroup.Text><Search /></InputGroup.Text>
              <Form.Control
                placeholder={`Search in ${activeBucket}…`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </div>

          {/* File list */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-muted py-5">
              {searchTerm ? 'No files match your search.' : 'This bucket is empty. Upload files to get started.'}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 40 }}></th>
                    <th>File Name</th>
                    <th>Size</th>
                    <th>Uploaded</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((file) => (
                    <tr key={file.name}>
                      <td>{fileIcon(file.name)}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {isPreviewable(file.name) && (
                            <img
                              src={getPublicUrl(activeBucket, file.name)}
                              alt=""
                              style={{
                                width: 36,
                                height: 36,
                                objectFit: 'cover',
                                borderRadius: 4,
                              }}
                              loading="lazy"
                            />
                          )}
                          <span className="text-break">{file.name}</span>
                        </div>
                      </td>
                      <td className="text-muted small">{humanSize(file.metadata?.size)}</td>
                      <td className="text-muted small">
                        {file.created_at
                          ? new Date(file.created_at).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1 flex-wrap">
                          {/* Copy URL */}
                          <Button
                            variant={copiedFile === file.name ? 'success' : 'outline-secondary'}
                            size="sm"
                            title="Copy public URL"
                            onClick={() => handleCopyUrl(file.name)}
                          >
                            {copiedFile === file.name ? <ClipboardCheck /> : <Clipboard />}
                          </Button>

                          {/* Rename — books bucket, everyone can rename */}
                          {activeBucket === 'books' && canRenameBooks && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              title="Rename"
                              onClick={() => openRename(file)}
                            >
                              <PencilSquare />
                            </Button>
                          )}

                          {/* Delete — super_admin, admin, team_member only */}
                          {canDelete && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              title="Delete"
                              onClick={() => handleDelete(file.name)}
                            >
                              <Trash />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-3 py-2 border-top text-muted small">
            {filtered.length} file{filtered.length !== 1 ? 's' : ''}{' '}
            {searchTerm ? '(filtered)' : ''}
          </div>
        </div>
      </div>

      {/* ── Rename Modal ─────────────────────────────────────── */}
      <Modal show={renameModal} onHide={() => setRenameModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-5">Rename File</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label className="fw-semibold">New file name</Form.Label>
            <Form.Control
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name"
            />
            {renameTarget && (
              <Form.Text className="text-muted">
                Extension will be preserved:{' '}
                <strong>
                  {renameTarget.name.includes('.')
                    ? `.${renameTarget.name.split('.').pop()}`
                    : '(none)'}
                </strong>
              </Form.Text>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setRenameModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleRename} disabled={renaming || !newName.trim()}>
            {renaming ? 'Renaming…' : 'Rename'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
