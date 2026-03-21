import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
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

const PER_PAGE_OPTIONS = [10, 15, 20, 50];

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<CreateUserDto>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const { t } = useTranslation();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeModal = () => { setShowModal(false); setForm(emptyForm); };

  const load = async (p = page, pp = perPage, s = search) => {
    setFetching(true);
    try {
      const res = await getUsers(p, pp, s);
      setUsers(Array.isArray(res.data) ? res.data : []);
      setTotal(res.total ?? 0);
      setPage(res.page ?? p);
      setLastPage(res.lastPage ?? 1);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('users.failedLoad'));
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { load(page, perPage, search); }, [page, perPage]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      load(1, perPage, value);
    }, 400);
  };

  const handleCreate = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUser(form);
      setForm(emptyForm);
      setShowModal(false);
      setPage(1);
      await load(1, perPage, search);
      toast.success(t('users.created'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('users.failedCreate'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      toast.success(t('users.deleted'));
      await load(page, perPage, search);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('users.failedDelete'));
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <>
      <div className="page-title">
        <h2>{t('users.pageTitle')}</h2>
        <p>{t('users.pageSubtitle')}</p>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>👥</div>
          <div className="stat-info">
            <p>{t('users.totalUsers')}</p>
            <span>{total}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)' }}>🛡️</div>
          <div className="stat-info">
            <p>{t('users.admins')}</p>
            <span>{users.filter(u => u.type === 'admin').length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>👤</div>
          <div className="stat-info">
            <p>{t('users.regularUsers')}</p>
            <span>{users.filter(u => u.type === 'user').length}</span>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="card">
        <div className="table-header">
          <div><h3>{t('users.tableTitle')} <span>({total})</span></h3></div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            {t('users.newUser')}
          </button>
        </div>

        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
          <input
            style={{ maxWidth: 360, height: 36 }}
            placeholder={t('users.searchPlaceholder')}
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          {fetching ? (
            <div className="empty-state"><span>{t('users.loading')}</span></div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <p>{search ? t('users.noResults') : t('users.noUsers')}</p>
              <span>{search ? t('users.noResultsHint') : t('users.noUsersHint')}</span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t('users.colName')}</th>
                  <th>{t('users.colEmail')}</th>
                  <th>{t('users.colPhone')}</th>
                  <th>{t('users.colRole')}</th>
                  <th>{t('users.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id}>
                    <td data-label={t('users.colName')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          {u.full_name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <span style={{ fontWeight: 500 }}>{u.full_name}</span>
                      </div>
                    </td>
                    <td data-label={t('users.colEmail')} style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td data-label={t('users.colPhone')} style={{ color: 'var(--text-secondary)' }}>{u.phone_number}</td>
                    <td data-label={t('users.colRole')}>
                      <span className={`badge ${u.type === 'admin' ? 'badge-blue' : 'badge-gray'}`}>
                        {u.type === 'admin' ? t('users.roleAdmin') : t('users.roleUser')}
                      </span>
                    </td>
                    <td data-label={t('users.colActions')}>
                      <button className="btn-danger btn-sm" onClick={() => setConfirmId(u.id)}>
                        {t('users.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!fetching && total > 0 && (
          <div className="pagination">
            <div className="pagination-info">
              {t('users.showingOf', { from: (page - 1) * perPage + 1, to: Math.min(page * perPage, total), total })}
            </div>
            <div className="pagination-controls">
              <div className="pagination-per-page">
                <span>{t('users.perPage')}</span>
                <select
                  value={perPage}
                  onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
                  style={{ width: 'auto', height: 30, padding: '0 24px 0 8px', fontSize: 12 }}
                >
                  {PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="pagination-pages">
                <button className="btn-ghost btn-sm pagination-btn" disabled={page <= 1} onClick={() => setPage(1)}>«</button>
                <button className="btn-ghost btn-sm pagination-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{t('users.prev')}</button>
                {Array.from({ length: lastPage }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === lastPage || Math.abs(p - page) <= 1)
                  .reduce<(number | '…')[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '…'
                      ? <span key={`e-${i}`} className="pagination-ellipsis">…</span>
                      : <button key={p} className={`btn-sm pagination-btn${page === p ? ' active' : ' btn-ghost'}`} onClick={() => setPage(p as number)}>{p}</button>
                  )}
                <button className="btn-ghost btn-sm pagination-btn" disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}>{t('users.next')}</button>
                <button className="btn-ghost btn-sm pagination-btn" disabled={page >= lastPage} onClick={() => setPage(lastPage)}>»</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h3>{t('users.modalTitle')}</h3>
              <button className="btn-ghost btn-icon" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('users.fullName')}</label>
                    <input placeholder={t('users.fullNamePlaceholder')} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>{t('users.role')}</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'admin' | 'user' })}>
                      <option value="user">{t('users.roleUser')}</option>
                      <option value="admin">{t('users.roleAdmin')}</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('users.emailLabel')}</label>
                  <input type="email" placeholder="john@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>{t('users.colPhone')}</label>
                  <input
                    placeholder={t('users.phonePlaceholder')}
                    value={form.phone_number}
                    onChange={e => setForm({ ...form, phone_number: formatPhone(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('users.passwordLabel')}</label>
                  <input type="password" placeholder={t('users.passwordPlaceholder')} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={5} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>{t('users.cancel')}</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? t('users.creating') : t('users.createUser')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmId && (
        <ConfirmDialog
          title={t('users.confirmDeleteTitle')}
          message={t('users.confirmDeleteMessage')}
          confirmLabel={t('users.delete')}
          danger
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </>
  );
}
