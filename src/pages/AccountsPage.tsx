import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { supabase, ACCOUNT_TYPES_TABLE, AccountType } from '../lib/supabaseClient';
import { can } from '../lib/permissions';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, PencilSquare, Trash, KeyFill } from 'react-bootstrap-icons';

interface Account {
  id: number;
  user_email: string;
  account_type: string;
  created_at: string;
}

const ALLOWED_TYPES_FOR_ADMIN: AccountType[] = ['team_member', 'manager'];
const ALL_TYPES: AccountType[] = ['super_admin', 'admin', 'team_member', 'manager'];

export function AccountsPage() {
  const { accountType } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [formEmail, setFormEmail] = useState('');
  const [formType, setFormType] = useState<AccountType>('team_member');
  const [formPassword, setFormPassword] = useState('');
  const [saving, setSaving] = useState(false);

  // Password reset state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<Account | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const allowedTypes = accountType === 'super_admin' ? ALL_TYPES : ALLOWED_TYPES_FOR_ADMIN;

  const fetchAccounts = async () => {
    setLoading(true);
    let query = supabase.from(ACCOUNT_TYPES_TABLE).select('*').order('created_at', { ascending: false });
    if (accountType === 'admin') {
      query = query.in('account_type', ALLOWED_TYPES_FOR_ADMIN);
    }
    const { data, error } = await query;
    if (error) setError(error.message);
    else setAccounts(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAccounts(); }, []);

  const openCreate = () => {
    setEditing(null);
    setFormEmail('');
    setFormType('team_member');
    setFormPassword('');
    setShowModal(true);
  };

  const openEdit = (a: Account) => {
    setEditing(a);
    setFormEmail(a.user_email);
    setFormType(a.account_type as AccountType);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    if (editing) {
      // Update: only update the account-types row
      const { error } = await supabase.from(ACCOUNT_TYPES_TABLE).update({ user_email: formEmail, account_type: formType }).eq('id', editing.id);
      if (error) setError(error.message);
      else setSuccess('Account updated successfully');
    } else {
      // Create: call Edge Function to create auth user + account-types row
      if (formPassword.length < 6) {
        setError('Password must be at least 6 characters');
        setSaving(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setError('You must be logged in'); setSaving(false); return; }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const res = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email: formEmail,
            password: formPassword,
            account_type: formType,
          }),
        });

        const result = await res.json();

        if (!res.ok || result.error) {
          setError(result.error || 'Failed to create account');
        } else {
          setSuccess(`Account created successfully for ${formEmail}`);
        }
      } catch (err) {
        setError((err as Error).message);
      }
    }

    setSaving(false);
    setShowModal(false);
    fetchAccounts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this account?')) return;
    const { error } = await supabase.from(ACCOUNT_TYPES_TABLE).delete().eq('id', id);
    if (error) setError(error.message);
    fetchAccounts();
  };

  // --- Password reset ---
  const canResetPasswords = accountType === 'super_admin' || accountType === 'admin';

  const openPasswordModal = (account: Account) => {
    // Admin cannot reset passwords for super_admin or admin accounts
    if (accountType === 'admin' && ['super_admin', 'admin'].includes(account.account_type)) return;
    setPasswordTarget(account);
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(true);
  };

  const handlePasswordUpdate = async () => {
    if (!passwordTarget) return;
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    setUpdatingPassword(true);
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('You must be logged in'); setUpdatingPassword(false); return; }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/update-user-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_email: passwordTarget.user_email,
          new_password: newPassword,
        }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        setError(result.error || 'Failed to update password');
      } else {
        setSuccess(`Password updated successfully for ${passwordTarget.user_email}`);
        setShowPasswordModal(false);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (!can(accountType, 'accounts', 'read')) return <div className="container-fluid p-4"><Alert variant="danger">Access denied.</Alert></div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="text-primary mb-0">Accounts</h4>
        {can(accountType, 'accounts', 'create') && (
          <Button variant="primary" size="sm" onClick={openCreate} className="d-flex align-items-center gap-2">
            <PlusCircle /> Add Account
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      {loading ? <Spinner animation="border" variant="primary" /> : (
        <div className="card border-0 shadow-sm">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Email</th>
                <th>Account Type</th>
                <th>Created</th>
                <th style={{ width: '160px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(a => (
                <tr key={a.id}>
                  <td>{a.user_email}</td>
                  <td><span className="badge bg-primary text-uppercase">{a.account_type?.replace('_', ' ')}</span></td>
                  <td>{new Date(a.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="d-flex gap-1">
                      {can(accountType, 'accounts', 'update') && (
                        <Button variant="outline-primary" size="sm" onClick={() => openEdit(a)} title="Edit"><PencilSquare /></Button>
                      )}
                      {canResetPasswords && !(accountType === 'admin' && ['super_admin', 'admin'].includes(a.account_type)) && (
                        <Button variant="outline-warning" size="sm" onClick={() => openPasswordModal(a)} title="Reset Password"><KeyFill /></Button>
                      )}
                      {can(accountType, 'accounts', 'delete') && (
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(a.id)} title="Delete"><Trash /></Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && <tr><td colSpan={4} className="text-center text-muted py-4">No accounts found.</td></tr>}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="text-primary">{editing ? 'Edit Account' : 'Add Account'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Email</Form.Label>
            <Form.Control type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Account Type</Form.Label>
            <Form.Select value={formType} onChange={e => setFormType(e.target.value as AccountType)}>
              {allowedTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </Form.Select>
          </Form.Group>
          {!editing && (
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Password</Form.Label>
              <Form.Control
                type="password"
                value={formPassword}
                onChange={e => setFormPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                minLength={6}
                required
              />
              <Form.Text className="text-muted">
                This will be the user's login password. They can change it later.
              </Form.Text>
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving || !formEmail || (!editing && formPassword.length < 6)}>{saving ? 'Saving...' : 'Save'}</Button>
        </Modal.Footer>
      </Modal>

      {/* Password Reset Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="text-primary">Reset Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {passwordTarget && (
            <Alert variant="info" className="mb-3">
              Resetting password for <strong>{passwordTarget.user_email}</strong>
            </Alert>
          )}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">New Password</Form.Label>
            <Form.Control
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              minLength={6}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Confirm Password</Form.Label>
            <Form.Control
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              isInvalid={confirmPassword.length > 0 && newPassword !== confirmPassword}
            />
            <Form.Control.Feedback type="invalid">
              Passwords do not match
            </Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
          <Button
            variant="warning"
            onClick={handlePasswordUpdate}
            disabled={updatingPassword || newPassword.length < 6 || newPassword !== confirmPassword}
          >
            {updatingPassword ? 'Updating...' : 'Update Password'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
