import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getUsers, createUser, deleteUser, type CreateUserDto } from '../api/users';
import ConfirmDialog from '../components/ConfirmDialog';

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 12);
  const local = digits.startsWith('998') ? digits.slice(3) : digits;
  let out = '+998';
  if (local.length > 0) out += ' (' + local.slice(0, 2);
  if (local.length >= 2) out += ') ' + local.slice(2, 5);
  if (local.length >= 5) out += '-' + local.slice(5, 7);
  if (local.length >= 7) out += '-' + local.slice(7, 9);
  return out;
}

const emptyForm: CreateUserDto = {
  email: '', full_name: '', password: '', type: 'user', phone_number: '',
};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState<CreateUserDto>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = async () => {
    setFetching(true);
    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUser(form);
      setForm(emptyForm);
      setShowModal(false);
      await load();
      toast.success('User created successfully');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('User deleted');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <>
      <div className="page-title">
        <h2>Users</h2>
        <p>Manage all registered users</p>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>👥</div>
          <div className="stat-info">
            <p>Total Users</p>
            <span>{users.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)' }}>🛡️</div>
          <div className="stat-info">
            <p>Admins</p>
            <span>{users.filter(u => u.type === 'admin').length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>👤</div>
          <div className="stat-info">
            <p>Regular Users</p>
            <span>{users.filter(u => u.type === 'user').length}</span>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="card">
        <div className="table-header">
          <div>
            <h3>Users <span>({users.length})</span></h3>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + New User
          </button>
        </div>

        <div className="table-wrap">
          {fetching ? (
            <div className="empty-state"><span>Loading…</span></div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <p>No users yet</p>
              <span>Create your first user to get started</span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id}>
                    <td data-label="Name">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          {u.full_name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <span style={{ fontWeight: 500 }}>{u.full_name}</span>
                      </div>
                    </td>
                    <td data-label="Email" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td data-label="Phone" style={{ color: 'var(--text-secondary)' }}>{u.phone_number}</td>
                    <td data-label="Role">
                      <span className={`badge ${u.type === 'admin' ? 'badge-blue' : 'badge-gray'}`}>
                        {u.type}
                      </span>
                    </td>
                    <td data-label="Actions">
                      <button className="btn-danger btn-sm" onClick={() => setConfirmId(u.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>New User</h3>
              <button className="btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input placeholder="John Doe" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'admin' | 'user' })}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" placeholder="john@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    placeholder="+998 (90) 123-45-67"
                    value={form.phone_number}
                    onChange={e => setForm({ ...form, phone_number: formatPhone(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" placeholder="Min 5 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={5} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmId && (
        <ConfirmDialog
          title="Delete User"
          message="Are you sure you want to delete this user? This action cannot be undone."
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </>
  );
}
