import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  Map, CheckCircle2, Zap, Users, Plus, Search, Eye, Flag, Trash2,
  X, Calendar, Loader2, FileText,
} from 'lucide-react';
import {
  getGroupDashboard, getGroups, createGroup, deleteGroup, finishGroup,
  type CreateGroupDto,
} from '../api/groups';
import ConfirmDialog from '../components/ConfirmDialog';
import { Pagination } from './UsersPage';

const emptyGroupForm: CreateGroupDto = { name: '', description: '', date: '' };
const PER_PAGE_OPTIONS = [10, 20, 50];

export default function GroupsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { t } = useTranslation();

  const [groups, setGroups] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [lastPage, setLastPage] = useState(1);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [dashboard, setDashboard] = useState({ total: 0, finished: 0, active: 0, totalMembers: 0 });
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState<CreateGroupDto>(emptyGroupForm);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmFinish, setConfirmFinish] = useState<string | null>(null);

  const loadDashboard = async () => {
    try { const res = await getGroupDashboard(); setDashboard(res); } catch { /* silent */ }
  };

  const load = async (p = page, pp = perPage, s = search) => {
    setFetching(true);
    try {
      const res = await getGroups(p, pp, s);
      setGroups(Array.isArray(res.data) ? res.data : []);
      setTotal(res.total ?? 0);
      setPage(res.page ?? p);
      setLastPage(res.lastPage ?? 1);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('groups.failedLoad'));
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);
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
      await createGroup(form);
      setForm(emptyGroupForm);
      setShowModal(false);
      setPage(1);
      await Promise.all([load(1, perPage, search), loadDashboard()]);
      toast.success(t('groups.created'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('groups.failedCreate'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGroup(id);
      await Promise.all([load(page, perPage, search), loadDashboard()]);
      toast.success(t('groups.deleted'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('groups.failedDelete'));
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleFinish = async (id: string) => {
    try {
      await finishGroup(id);
      await Promise.all([load(page, perPage, search), loadDashboard()]);
      toast.success(t('groups.markedFinished'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('groups.failedFinish'));
    } finally {
      setConfirmFinish(null);
    }
  };

  const closeGroupModal = () => { setShowModal(false); setForm(emptyGroupForm); };

  return (
    <>
      <div className="page-title">
        <h2>{t('groups.pageTitle')}</h2>
        <p>{t('groups.pageSubtitle')}</p>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-card" style={{ '--stat-accent': 'var(--primary)' } as React.CSSProperties}>
          <div className="stat-card-head">
            <p className="stat-label">{t('groups.totalGroups')}</p>
            <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Map size={20} strokeWidth={2} />
            </div>
          </div>
          <span className="stat-value">{dashboard.total}</span>
        </div>
        <div className="stat-card" style={{ '--stat-accent': 'var(--success)' } as React.CSSProperties}>
          <div className="stat-card-head">
            <p className="stat-label">{t('groups.finished')}</p>
            <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
              <CheckCircle2 size={20} strokeWidth={2} />
            </div>
          </div>
          <span className="stat-value">{dashboard.finished}</span>
        </div>
        <div className="stat-card" style={{ '--stat-accent': 'var(--warning)' } as React.CSSProperties}>
          <div className="stat-card-head">
            <p className="stat-label">{t('groups.active')}</p>
            <div className="stat-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
              <Zap size={20} strokeWidth={2} />
            </div>
          </div>
          <span className="stat-value">{dashboard.active}</span>
        </div>
        <div className="stat-card" style={{ '--stat-accent': 'var(--purple)' } as React.CSSProperties}>
          <div className="stat-card-head">
            <p className="stat-label">{t('groups.members')}</p>
            <div className="stat-icon" style={{ background: 'var(--purple-light)', color: 'var(--purple)' }}>
              <Users size={20} strokeWidth={2} />
            </div>
          </div>
          <span className="stat-value">{dashboard.totalMembers}</span>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-header">
          <div className="table-header-left">
            <h3>{t('groups.tableTitle')}</h3>
            <span className="table-header-sub">{total} {t('groups.totalGroups').toLowerCase()}</span>
          </div>
          <div className="table-header-actions">
            {isAdmin && (
              <button className="btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={15} />{t('groups.newGroup')}
              </button>
            )}
          </div>
        </div>

        <div className="search-bar">
          <div className="input-with-icon search-input">
            <span className="input-icon"><Search size={14} /></span>
            <input
              placeholder={t('groups.searchPlaceholder')}
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
              <span>{t('groups.loading')}</span>
            </div>
          ) : groups.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Map size={22} /></div>
              <p>{search ? t('groups.noResults') : t('groups.noGroups')}</p>
              <span>{search ? t('groups.noResultsHint') : t('groups.noGroupsHint')}</span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t('groups.colName')}</th>
                  <th>{t('groups.colDescription')}</th>
                  <th>{t('groups.colDate')}</th>
                  <th>{t('groups.colMembers')}</th>
                  <th>{t('groups.colStatus')}</th>
                  <th>{t('groups.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g: any) => (
                  <tr key={g.id}>
                    <td data-label={t('groups.colName')}>
                      <span style={{ fontWeight: 600 }}>{g.name}</span>
                    </td>
                    <td data-label={t('groups.colDescription')} style={{ color: 'var(--text-secondary)', maxWidth: 200 }}>
                      {g.description || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td data-label={t('groups.colDate')}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 12 }}>
                        <Calendar size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        {g.date ? new Date(g.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </span>
                    </td>
                    <td data-label={t('groups.colMembers')}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        <Users size={13} style={{ color: 'var(--text-muted)' }} />
                        {g._count?.groupMember ?? 0}
                      </span>
                    </td>
                    <td data-label={t('groups.colStatus')}>
                      <span className={`badge ${g.is_finished ? 'badge-green' : 'badge-yellow'}`}>
                        {g.is_finished
                          ? <><CheckCircle2 size={10} />{t('groups.statusFinished')}</>
                          : <><Zap size={10} />{t('groups.statusActive')}</>
                        }
                      </span>
                    </td>
                    <td data-label={t('groups.colActions')}>
                      <div className="table-actions">
                        <button
                          className="btn-ghost btn-icon"
                          onClick={() => navigate(`/groups/${g.id}`)}
                          title={t('groups.view')}
                        >
                          <Eye size={15} />
                        </button>
                        {!g.is_finished && (
                          <button
                            className="btn-success btn-icon"
                            onClick={() => setConfirmFinish(g.id)}
                            title={t('groups.finish')}
                          >
                            <Flag size={14} />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            className="btn-danger btn-icon"
                            onClick={() => setConfirmDelete(g.id)}
                            title={t('groups.delete')}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!fetching && total > 0 && (
          <Pagination
            page={page} lastPage={lastPage} perPage={perPage} total={total}
            perPageOptions={PER_PAGE_OPTIONS}
            showingFrom={(page - 1) * perPage + 1}
            showingTo={Math.min(page * perPage, total)}
            onPage={setPage}
            onPerPage={n => { setPerPage(n); setPage(1); }}
            perPageLabel={t('groups.perPage')}
          />
        )}
      </div>

      {/* Create Group Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeGroupModal()}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-header-title">
                <div className="modal-header-icon" style={{ background: 'var(--purple-light)', color: 'var(--purple)' }}>
                  <Map size={18} strokeWidth={2} />
                </div>
                <h3>{t('groups.modalTitle')}</h3>
              </div>
              <button className="btn-ghost btn-icon" onClick={closeGroupModal}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>{t('groups.groupName')}</label>
                  <div className="input-with-icon">
                    <span className="input-icon"><Map size={14} /></span>
                    <input placeholder={t('groups.groupNamePlaceholder')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>
                    {t('groups.description')}{' '}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({t('groups.optional')})</span>
                  </label>
                  <div className="input-with-icon">
                    <span className="input-icon"><FileText size={14} /></span>
                    <input placeholder={t('groups.descriptionPlaceholder')} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('groups.date')}</label>
                  <div className="input-with-icon">
                    <span className="input-icon"><Calendar size={14} /></span>
                    <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required style={{ paddingLeft: 36 }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeGroupModal}>{t('groups.cancel')}</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading
                    ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />{t('groups.creating')}</>
                    : <><Plus size={14} />{t('groups.createGroup')}</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={t('groups.confirmDeleteTitle')}
          message={t('groups.confirmDeleteMessage')}
          confirmLabel={t('groups.delete')}
          danger
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmFinish && (
        <ConfirmDialog
          title={t('groups.confirmFinishTitle')}
          message={t('groups.confirmFinishMessage')}
          confirmLabel={t('groups.finish')}
          onConfirm={() => handleFinish(confirmFinish)}
          onCancel={() => setConfirmFinish(null)}
        />
      )}
    </>
  );
}
