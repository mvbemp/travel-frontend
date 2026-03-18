import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  getGroupDashboard, getGroups, createGroup, deleteGroup, finishGroup, addMember, updateMember, deleteMember,
  type CreateGroupDto,
} from '../api/groups';
import { getCurrencies, type Currency } from '../api/currencies';
import ConfirmDialog from '../components/ConfirmDialog';
import MemberFormModal, { type MemberForm } from '../components/MemberFormModal';

const emptyGroupForm: CreateGroupDto = { name: '', description: '', date: '' };
const emptyMemberForm: MemberForm = { name: '', passport: '', passport_type: undefined, currency_id: undefined, payment: undefined };

const PER_PAGE_OPTIONS = [10, 20, 50];

export default function GroupsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { t } = useTranslation();

  const PASSPORT_LABELS: Record<string, string> = {
    green_passport: t('groups.passportGreen'),
    red_passport: t('groups.passportRed'),
    id_card: t('groups.passportId'),
  };

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

  // Members panel
  const [membersGroup, setMembersGroup] = useState<any | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState<MemberForm>(emptyMemberForm);
  const [addingMember, setAddingMember] = useState(false);

  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [editMemberForm, setEditMemberForm] = useState<MemberForm>(emptyMemberForm);
  const [savingMember, setSavingMember] = useState(false);

  const [confirmDeleteMember, setConfirmDeleteMember] = useState<any | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  const loadDashboard = async () => {
    try {
      const res = await getGroupDashboard();
      setDashboard(res);
    } catch {
      // non-critical, keep previous values
    }
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

  useEffect(() => {
    loadDashboard();
    getCurrencies().then(d => setCurrencies(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);
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
      if (membersGroup?.id === id) setMembersGroup((prev: any) => ({ ...prev, is_finished: true }));
      toast.success(t('groups.markedFinished'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('groups.failedFinish'));
    } finally {
      setConfirmFinish(null);
    }
  };

  const handleAddMember = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!membersGroup) return;
    setAddingMember(true);
    try {
      const payload: any = { name: memberForm.name };
      if (memberForm.passport) payload.passport = memberForm.passport;
      if (memberForm.passport_type) payload.passport_type = memberForm.passport_type;
      if (memberForm.currency_id) payload.currency_id = memberForm.currency_id;
      if (memberForm.payment !== undefined) payload.payment = Number(memberForm.payment);
      const newMember = await addMember(membersGroup.id, payload);
      const updatedGroup = { ...membersGroup, groupMember: [...(membersGroup.groupMember ?? []), newMember] };
      setMembersGroup(updatedGroup);
      setGroups(prev => prev.map(g => g.id === membersGroup.id ? updatedGroup : g));
      setMemberForm(emptyMemberForm);
      setShowAddMember(false);
      toast.success(t('groups.memberAdded'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('groups.failedAddMember'));
    } finally {
      setAddingMember(false);
    }
  };

  const startEditMember = (m: any) => {
    setEditingMember(m);
    setEditMemberForm({ name: m.name, passport: m.passport ?? '', passport_type: m.passport_type ?? undefined, currency_id: m.currency_id ?? undefined, payment: m.payment ?? undefined });
  };

  const handleEditMember = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!membersGroup || !editingMember) return;
    setSavingMember(true);
    try {
      const payload: any = { name: editMemberForm.name };
      if (editMemberForm.passport !== undefined) payload.passport = editMemberForm.passport;
      if (editMemberForm.passport_type) payload.passport_type = editMemberForm.passport_type;
      if (editMemberForm.currency_id) payload.currency_id = editMemberForm.currency_id;
      if (editMemberForm.payment !== undefined) payload.payment = Number(editMemberForm.payment);
      const updated = await updateMember(membersGroup.id, editingMember.id, payload);
      const updatedGroup = { ...membersGroup, groupMember: membersGroup.groupMember.map((m: any) => m.id === editingMember.id ? updated : m) };
      setMembersGroup(updatedGroup);
      setGroups(prev => prev.map(g => g.id === membersGroup.id ? updatedGroup : g));
      setEditingMember(null);
      toast.success(t('groups.memberUpdated'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('groups.failedUpdateMember'));
    } finally {
      setSavingMember(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!membersGroup || !confirmDeleteMember) return;
    try {
      await deleteMember(membersGroup.id, confirmDeleteMember.id);
      const updatedGroup = { ...membersGroup, groupMember: membersGroup.groupMember.filter((m: any) => m.id !== confirmDeleteMember.id) };
      setMembersGroup(updatedGroup);
      setGroups(prev => prev.map(g => g.id === membersGroup.id ? updatedGroup : g));
      toast.success(t('groups.memberRemoved'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('groups.failedRemoveMember'));
    } finally {
      setConfirmDeleteMember(null);
    }
  };

  const closeGroupModal = () => {
    setShowModal(false);
    setForm(emptyGroupForm);
  };

  return (
    <>
      <div className="page-title">
        <h2>{t('groups.pageTitle')}</h2>
        <p>{t('groups.pageSubtitle')}</p>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>🗂️</div>
          <div className="stat-info"><p>{t('groups.totalGroups')}</p><span>{dashboard.total}</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)' }}>✅</div>
          <div className="stat-info"><p>{t('groups.finished')}</p><span>{dashboard.finished}</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>🔄</div>
          <div className="stat-info"><p>{t('groups.active')}</p><span>{dashboard.active}</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f0fdf4' }}>👤</div>
          <div className="stat-info"><p>{t('groups.members')}</p><span>{dashboard.totalMembers}</span></div>
        </div>
      </div>

      {/* Groups table */}
      <div className="card">
        <div className="table-header">
          <div><h3>{t('groups.tableTitle')} <span>({total})</span></h3></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              style={{ width: 220, height: 36, fontSize: 14 }}
              placeholder={t('groups.searchPlaceholder')}
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
            />
            {isAdmin && <button className="btn-primary" onClick={() => setShowModal(true)}>{t('groups.newGroup')}</button>}
          </div>
        </div>

        <div className="table-wrap">
          {fetching ? (
            <div className="empty-state"><span>{t('groups.loading')}</span></div>
          ) : groups.length === 0 ? (
            <div className="empty-state">
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
                    <td data-label={t('groups.colName')} style={{ fontWeight: 500 }}>{g.name}</td>
                    <td data-label={t('groups.colDescription')} style={{ color: 'var(--text-secondary)', maxWidth: 200 }}>
                      {g.description || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td data-label={t('groups.colDate')} style={{ color: 'var(--text-secondary)' }}>
                      {g.date ? new Date(g.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td data-label={t('groups.colMembers')}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        👤 {g._count?.groupMember ?? 0}
                      </span>
                    </td>
                    <td data-label={t('groups.colStatus')}>
                      <span className={`badge ${g.is_finished ? 'badge-green' : 'badge-yellow'}`}>
                        {g.is_finished ? t('groups.statusFinished') : t('groups.statusActive')}
                      </span>
                    </td>
                    <td data-label={t('groups.colActions')}>
                      <div className="table-actions">
                        <button className="btn-ghost btn-sm" onClick={() => navigate(`/groups/${g.id}`)}>{t('groups.view')}</button>
                        {!g.is_finished && (
                          <button className="btn-success btn-sm" onClick={() => setConfirmFinish(g.id)}>{t('groups.finish')}</button>
                        )}
                        {isAdmin && <button className="btn-danger btn-sm" onClick={() => setConfirmDelete(g.id)}>{t('groups.delete')}</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination footer */}
        {!fetching && total > 0 && (
          <div className="pagination">
            <div className="pagination-info">
              {t('groups.showingOf', { from: (page - 1) * perPage + 1, to: Math.min(page * perPage, total), total })}
            </div>
            <div className="pagination-controls">
              <div className="pagination-per-page">
                <span>{t('groups.perPage')}</span>
                <select
                  value={perPage}
                  onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
                  style={{ width: 'auto', height: 30, padding: '0 24px 0 8px', fontSize: 12 }}
                >
                  {PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="pagination-pages">
                <button
                  className="btn-ghost btn-sm pagination-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                >«</button>
                <button
                  className="btn-ghost btn-sm pagination-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >{t('groups.prev')}</button>
                {Array.from({ length: lastPage }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === lastPage || Math.abs(p - page) <= 1)
                  .reduce<(number | '…')[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '…'
                      ? <span key={`ellipsis-${i}`} className="pagination-ellipsis">…</span>
                      : <button
                          key={p}
                          className={`btn-sm pagination-btn${page === p ? ' active' : ' btn-ghost'}`}
                          onClick={() => setPage(p as number)}
                        >{p}</button>
                  )
                }
                <button
                  className="btn-ghost btn-sm pagination-btn"
                  disabled={page >= lastPage}
                  onClick={() => setPage(p => p + 1)}
                >{t('groups.next')}</button>
                <button
                  className="btn-ghost btn-sm pagination-btn"
                  disabled={page >= lastPage}
                  onClick={() => setPage(lastPage)}
                >»</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeGroupModal()}>
          <div className="modal">
            <div className="modal-header">
              <h3>{t('groups.modalTitle')}</h3>
              <button className="btn-ghost btn-icon" onClick={closeGroupModal}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>{t('groups.groupName')}</label>
                  <input placeholder={t('groups.groupNamePlaceholder')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>{t('groups.description')} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({t('groups.optional')})</span></label>
                  <input placeholder={t('groups.descriptionPlaceholder')} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>{t('groups.date')}</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeGroupModal}>{t('groups.cancel')}</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? t('groups.creating') : t('groups.createGroup')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members list modal */}
      {membersGroup && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setMembersGroup(null)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div>
                <h3>{membersGroup.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {membersGroup.groupMember?.length ?? 0} member{membersGroup.groupMember?.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button className="btn-ghost btn-icon" onClick={() => setMembersGroup(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: 0, gap: 0, maxHeight: '60vh', overflowY: 'auto' }}>
              {(membersGroup.groupMember?.length ?? 0) === 0 ? (
                <div className="empty-state" style={{ padding: '32px 20px' }}>
                  <p>{t('groups.membersModalNoMembers')}</p>
                  <span>{t('groups.membersModalNoMembersHint')}</span>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>{t('groups.colName')}</th>
                      <th>{t('groups.colPassport')}</th>
                      <th>{t('groups.colType')}</th>
                      <th>{t('groups.colPayment')}</th>
                      <th>{t('groups.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membersGroup.groupMember.map((m: any) => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 500 }}>{m.name}</td>
                        <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{m.passport || '—'}</td>
                        <td>
                          {m.passport_type
                            ? <span className="badge badge-blue">{PASSPORT_LABELS[m.passport_type] ?? m.passport_type}</span>
                            : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {m.payment != null ? `$${Number(m.payment).toLocaleString()}` : '—'}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button className="btn-ghost btn-sm" onClick={() => startEditMember(m)}>{t('groups.edit')}</button>
                            <button className="btn-danger btn-sm" onClick={() => setConfirmDeleteMember(m)}>{t('groups.delete')}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setMembersGroup(null)}>{t('groups.close')}</button>
              <button className="btn-primary" onClick={() => { setMemberForm(emptyMemberForm); setShowAddMember(true); }}>
                {t('groups.addMember')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddMember && membersGroup && (
        <MemberFormModal
          title={t('groups.addMemberTitle', { groupName: membersGroup.name })}
          form={memberForm}
          currencies={currencies}
          loading={addingMember}
          submitLabel={t('groupDetail.addMember')}
          onSubmit={handleAddMember}
          onChange={setMemberForm}
          onClose={() => { setShowAddMember(false); setMemberForm(emptyMemberForm); }}
        />
      )}

      {editingMember && membersGroup && (
        <MemberFormModal
          title={t('groups.editMemberTitle', { memberName: editingMember.name })}
          form={editMemberForm}
          currencies={currencies}
          loading={savingMember}
          submitLabel={t('groups.saveChanges')}
          onSubmit={handleEditMember}
          onChange={setEditMemberForm}
          onClose={() => setEditingMember(null)}
        />
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

      {confirmDeleteMember && (
        <ConfirmDialog
          title={t('groups.confirmRemoveMemberTitle')}
          message={t('groups.confirmRemoveMemberMessage', { name: confirmDeleteMember.name })}
          confirmLabel={t('groupDetail.delete')}
          danger
          onConfirm={handleDeleteMember}
          onCancel={() => setConfirmDeleteMember(null)}
        />
      )}
    </>
  );
}
