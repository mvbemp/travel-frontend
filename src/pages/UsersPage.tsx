import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  Users, ShieldCheck, User, Plus, Search, Trash2,
  X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Mail, Phone, Lock, Loader2,
} from 'lucide-react';
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

const emptyForm: CreateUserDto = { email: '', full_name: '', password: '', type: 'user', phone_number: '' };
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
    searchTimer.current = setTimeout(() => { setPage(1); load(1, perPage, value); }, 400);
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

  const adminsCount = users.filter(u => u.type === 'admin' || u.type === 'super_admin').length;
  const usersCount = users.filter(u => u.type === 'user').length;

  const roleColors: Record<string, string> = {
    admin: 'badge-blue',
    super_admin: 'badge-purple',
    user: 'badge-gray',
  };
  const roleLabel = (type: string) => {
    if (type === 'admin') return t('users.roleAdmin');
    if (type === 'super_admin') return t('users.roleSuperAdmin');
    return t('users.roleUser');
  };

  return (
    <>
      <div className="page-title">
        <h2>{t('users.pageTitle')}</h2>
        <p>{t('users.pageSubtitle')}</p>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-card" style={{ '--stat-accent': 'var(--primary)' } as React.CSSProperties}>
          <div className="stat-card-head">
            <p className="stat-label">{t('users.totalUsers')}</p>
            <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Users size={20} strokeWidth={2} />
            </div>
          </div>
          <span className="stat-value">{total}</span>
        </div>
        <div className="stat-card" style={{ '--stat-accent': 'var(--purple)' } as React.CSSProperties}>
          <div className="stat-card-head">
            <p className="stat-label">{t('users.admins')}</p>
            <div className="stat-icon" style={{ background: 'var(--purple-light)', color: 'var(--purple)' }}>
              <ShieldCheck size={20} strokeWidth={2} />
            </div>
          </div>
          <span className="stat-value">{adminsCount}</span>
        </div>
        <div className="stat-card" style={{ '--stat-accent': 'var(--info)' } as React.CSSProperties}>
          <div className="stat-card-head">
            <p className="stat-label">{t('users.regularUsers')}</p>
            <div className="stat-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}>
              <User size={20} strokeWidth={2} />
            </div>
          </div>
          <span className="stat-value">{usersCount}</span>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-header">
          <div className="table-header-left">
            <h3>{t('users.tableTitle')}</h3>
            <span className="table-header-sub">{total} {t('users.totalUsers').toLowerCase()}</span>
          </div>
          <div className="table-header-actions">
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={15} />
              {t('users.newUser')}
            </button>
          </div>
        </div>

        <div className="search-bar">
          <div className="input-with-icon search-input">
            <span className="input-icon"><Search size={14} /></span>
            <input
              placeholder={t('users.searchPlaceholder')}
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              style={{ height: 36 }}
            />
          </div>
        </div>

        <div className="table-wrap">
          {fetching ? (
            <div className="loading-state">
              <div className="spinner spinner-lg" />
              <span>{t('users.loading')}</span>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Users size={22} /></div>
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
                        <div className="user-avatar">
                          {(u.full_name?.[0] ?? u.email?.[0] ?? '?').toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{u.full_name}</span>
                      </div>
                    </td>
                    <td data-label={t('users.colEmail')}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Mail size={13} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                        {u.email}
                      </span>
                    </td>
                    <td data-label={t('users.colPhone')}>
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Phone size={13} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                        {u.phone_number}
                      </span>
                    </td>
                    <td data-label={t('users.colRole')}>
                      <span className={`badge ${roleColors[u.type] ?? 'badge-gray'}`}>
                        {roleLabel(u.type)}
                      </span>
                    </td>
                    <td data-label={t('users.colActions')}>
                      <button
                        className="btn-danger btn-icon"
                        onClick={() => setConfirmId(u.id)}
                        title={t('users.delete')}
                      >
                        <Trash2 size={14} />
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
          <Pagination
            page={page} lastPage={lastPage} perPage={perPage} total={total}
            perPageOptions={PER_PAGE_OPTIONS}
            showingFrom={(page - 1) * perPage + 1}
            showingTo={Math.min(page * perPage, total)}
            onPage={setPage}
            onPerPage={n => { setPerPage(n); setPage(1); }}
            perPageLabel={t('users.perPage')}
          />
        )}
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-header-title">
                <div className="modal-header-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                  <Users size={18} strokeWidth={2} />
                </div>
                <h3>{t('users.modalTitle')}</h3>
              </div>
              <button className="btn-ghost btn-icon" onClick={closeModal}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('users.fullName')}</label>
                    <div className="input-with-icon">
                      <span className="input-icon"><User size={14} /></span>
                      <input placeholder={t('users.fullNamePlaceholder')} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>{t('users.role')}</label>
                    <div className="input-with-icon">
                      <span className="input-icon"><ShieldCheck size={14} /></span>
                      <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'admin' | 'user' })} style={{ paddingLeft: 36 }}>
                        <option value="user">{t('users.roleUser')}</option>
                        <option value="admin">{t('users.roleAdmin')}</option>
                        <option value="super_admin">{t('users.roleSuperAdmin')}</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('users.emailLabel')}</label>
                  <div className="input-with-icon">
                    <span className="input-icon"><Mail size={14} /></span>
                    <input type="email" placeholder="john@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('users.colPhone')}</label>
                  <div className="input-with-icon">
                    <span className="input-icon"><Phone size={14} /></span>
                    <input placeholder={t('users.phonePlaceholder')} value={form.phone_number} onChange={e => setForm({ ...form, phone_number: formatPhone(e.target.value) })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('users.passwordLabel')}</label>
                  <div className="input-with-icon">
                    <span className="input-icon"><Lock size={14} /></span>
                    <input type="password" placeholder={t('users.passwordPlaceholder')} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={5} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>{t('users.cancel')}</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading
                    ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />{t('users.creating')}</>
                    : <><Plus size={14} />{t('users.createUser')}</>
                  }
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

/* ── Shared Pagination component ── */
interface PaginationProps {
  page: number;
  lastPage: number;
  perPage: number;
  total: number;
  perPageOptions: number[];
  showingFrom: number;
  showingTo: number;
  onPage: (p: number) => void;
  onPerPage: (n: number) => void;
  perPageLabel: string;
}

export function Pagination({ page, lastPage, perPage, total, perPageOptions, showingFrom, showingTo, onPage, onPerPage, perPageLabel }: PaginationProps) {
  const pages = Array.from({ length: lastPage }, (_, i) => i + 1)
    .filter(p => p === 1 || p === lastPage || Math.abs(p - page) <= 1)
    .reduce<(number | '…')[]>((acc, p, i, arr) => {
      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('…');
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="pagination">
      <div className="pagination-info">
        {showingFrom}–{showingTo} / {total}
      </div>
      <div className="pagination-controls">
        <div className="pagination-per-page">
          <span>{perPageLabel}</span>
          <select value={perPage} onChange={e => onPerPage(Number(e.target.value))}>
            {perPageOptions.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="pagination-pages">
          <button className="btn-ghost btn-sm pagination-btn" disabled={page <= 1} onClick={() => onPage(1)}>
            <ChevronsLeft size={13} />
          </button>
          <button className="btn-ghost btn-sm pagination-btn" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            <ChevronLeft size={13} />
          </button>
          {pages.map((p, i) =>
            p === '…'
              ? <span key={`e${i}`} className="pagination-ellipsis">…</span>
              : <button key={p} className={`btn-sm pagination-btn${page === p ? ' active' : ' btn-ghost'}`} onClick={() => onPage(p as number)}>{p}</button>
          )}
          <button className="btn-ghost btn-sm pagination-btn" disabled={page >= lastPage} onClick={() => onPage(page + 1)}>
            <ChevronRight size={13} />
          </button>
          <button className="btn-ghost btn-sm pagination-btn" disabled={page >= lastPage} onClick={() => onPage(lastPage)}>
            <ChevronsRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
