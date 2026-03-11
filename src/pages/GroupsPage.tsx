import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  getGroups, createGroup, deleteGroup, finishGroup, addMember, updateMember, deleteMember,
  type CreateGroupDto,
} from '../api/groups';
import ConfirmDialog from '../components/ConfirmDialog';
import MemberFormModal, { type MemberForm } from '../components/MemberFormModal';

const emptyGroupForm: CreateGroupDto = { name: '', description: '', date: '' };
const emptyMemberForm: MemberForm = { name: '', passport: '', passport_type: undefined, payment: undefined };

const PASSPORT_LABELS: Record<string, string> = {
  green_passport: 'Green Passport',
  red_passport: 'Red Passport',
  id_card: 'ID Card',
};

const PER_PAGE_OPTIONS = [10, 20, 50];

export default function GroupsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [groups, setGroups] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [lastPage, setLastPage] = useState(1);
  const [fetching, setFetching] = useState(true);

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

  const load = async (p = page, pp = perPage) => {
    setFetching(true);
    try {
      const res = await getGroups(p, pp);
      setGroups(Array.isArray(res.data) ? res.data : []);
      setTotal(res.total ?? 0);
      setPage(res.page ?? p);
      setLastPage(res.lastPage ?? 1);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { load(page, perPage); }, [page, perPage]);

  const handleCreate = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createGroup(form);
      setForm(emptyGroupForm);
      setShowModal(false);
      await load(1, perPage);
      setPage(1);
      toast.success('Group created successfully');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGroup(id);
      setGroups(prev => prev.filter(g => g.id !== id));
      setTotal(prev => prev - 1);
      toast.success('Group deleted');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete group');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleFinish = async (id: string) => {
    try {
      await finishGroup(id);
      setGroups(prev => prev.map(g => g.id === id ? { ...g, is_finished: true } : g));
      if (membersGroup?.id === id) setMembersGroup((prev: any) => ({ ...prev, is_finished: true }));
      toast.success('Group marked as finished');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to finish group');
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
      if (memberForm.payment !== undefined) payload.payment = Number(memberForm.payment);
      const newMember = await addMember(membersGroup.id, payload);
      const updatedGroup = { ...membersGroup, groupMember: [...(membersGroup.groupMember ?? []), newMember] };
      setMembersGroup(updatedGroup);
      setGroups(prev => prev.map(g => g.id === membersGroup.id ? updatedGroup : g));
      setMemberForm(emptyMemberForm);
      setShowAddMember(false);
      toast.success('Member added');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const startEditMember = (m: any) => {
    setEditingMember(m);
    setEditMemberForm({ name: m.name, passport: m.passport ?? '', passport_type: m.passport_type ?? undefined, payment: m.payment ?? undefined });
  };

  const handleEditMember = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!membersGroup || !editingMember) return;
    setSavingMember(true);
    try {
      const payload: any = { name: editMemberForm.name };
      if (editMemberForm.passport !== undefined) payload.passport = editMemberForm.passport;
      if (editMemberForm.passport_type) payload.passport_type = editMemberForm.passport_type;
      if (editMemberForm.payment !== undefined) payload.payment = Number(editMemberForm.payment);
      const updated = await updateMember(membersGroup.id, editingMember.id, payload);
      const updatedGroup = { ...membersGroup, groupMember: membersGroup.groupMember.map((m: any) => m.id === editingMember.id ? updated : m) };
      setMembersGroup(updatedGroup);
      setGroups(prev => prev.map(g => g.id === membersGroup.id ? updatedGroup : g));
      setEditingMember(null);
      toast.success('Member updated');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update member');
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
      toast.success('Member removed');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setConfirmDeleteMember(null);
    }
  };

  const openMembers = (group: any) => {
    setMembersGroup(group);
    setEditingMember(null);
    setShowAddMember(false);
  };

  const finished = groups.filter(g => g.is_finished).length;
  const active = groups.length - finished;
  const totalMembers = groups.reduce((sum, g) => sum + (g.groupMember?.length ?? 0), 0);

  return (
    <>
      <div className="page-title">
        <h2>Groups</h2>
        <p>Manage travel groups and their members</p>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>🗂️</div>
          <div className="stat-info"><p>Total Groups</p><span>{total}</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)' }}>✅</div>
          <div className="stat-info"><p>Finished (page)</p><span>{finished}</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>🔄</div>
          <div className="stat-info"><p>Active (page)</p><span>{active}</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f0fdf4' }}>👤</div>
          <div className="stat-info"><p>Members (page)</p><span>{totalMembers}</span></div>
        </div>
      </div>

      {/* Groups table */}
      <div className="card">
        <div className="table-header">
          <div><h3>Groups <span>({total})</span></h3></div>
          {isAdmin && <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Group</button>}
        </div>

        <div className="table-wrap">
          {fetching ? (
            <div className="empty-state"><span>Loading…</span></div>
          ) : groups.length === 0 ? (
            <div className="empty-state">
              <p>No groups yet</p>
              <span>Create your first group to get started</span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Members</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g: any) => (
                  <tr key={g.id}>
                    <td data-label="Name" style={{ fontWeight: 500 }}>{g.name}</td>
                    <td data-label="Description" style={{ color: 'var(--text-secondary)', maxWidth: 200 }}>
                      {g.description || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td data-label="Date" style={{ color: 'var(--text-secondary)' }}>
                      {g.date ? new Date(g.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td data-label="Members">
                      <button className="btn-ghost btn-sm" style={{ gap: 5, fontWeight: 600 }} onClick={() => openMembers(g)}>
                        👤 {g.groupMember?.length ?? 0}
                      </button>
                    </td>
                    <td data-label="Status">
                      <span className={`badge ${g.is_finished ? 'badge-green' : 'badge-yellow'}`}>
                        {g.is_finished ? '✓ Finished' : '● Active'}
                      </span>
                    </td>
                    <td data-label="Actions">
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-ghost btn-sm" onClick={() => navigate(`/groups/${g.id}`)}>👁 View</button>
                        {!g.is_finished && (
                          <button className="btn-success btn-sm" onClick={() => setConfirmFinish(g.id)}>Finish</button>
                        )}
                        <button className="btn-danger btn-sm" onClick={() => setConfirmDelete(g.id)}>Delete</button>
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
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
            </div>
            <div className="pagination-controls">
              <div className="pagination-per-page">
                <span>Per page:</span>
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
                >‹ Prev</button>
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
                >Next ›</button>
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
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>New Group</h3>
              <button className="btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Group Name</label>
                  <input placeholder="Trip to Paris" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Description <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                  <input placeholder="Summer vacation group" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating…' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members list modal */}
      {membersGroup && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setMembersGroup(null)}>
          <div className="modal" style={{ maxWidth: 600 }}>
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
                  <p>No members yet</p>
                  <span>Add the first member to this group</span>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Passport</th>
                      <th>Type</th>
                      <th>Payment</th>
                      <th>Actions</th>
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
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button className="btn-ghost btn-sm" onClick={() => startEditMember(m)}>✏️ Edit</button>
                            <button className="btn-danger btn-sm" onClick={() => setConfirmDeleteMember(m)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setMembersGroup(null)}>Close</button>
              <button className="btn-primary" onClick={() => { setMemberForm(emptyMemberForm); setShowAddMember(true); }}>
                + Add Member
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddMember && membersGroup && (
        <MemberFormModal
          title={`Add Member — ${membersGroup.name}`}
          form={memberForm}
          loading={addingMember}
          submitLabel="Add Member"
          onSubmit={handleAddMember}
          onChange={setMemberForm}
          onClose={() => setShowAddMember(false)}
        />
      )}

      {editingMember && membersGroup && (
        <MemberFormModal
          title={`Edit — ${editingMember.name}`}
          form={editMemberForm}
          loading={savingMember}
          submitLabel="Save Changes"
          onSubmit={handleEditMember}
          onChange={setEditMemberForm}
          onClose={() => setEditingMember(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Group"
          message="Are you sure you want to delete this group? This action cannot be undone."
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmFinish && (
        <ConfirmDialog
          title="Finish Group"
          message="Mark this group as finished? This cannot be reversed."
          confirmLabel="Finish"
          onConfirm={() => handleFinish(confirmFinish)}
          onCancel={() => setConfirmFinish(null)}
        />
      )}

      {confirmDeleteMember && (
        <ConfirmDialog
          title="Remove Member"
          message={`Remove "${confirmDeleteMember.name}" from this group? This action cannot be undone.`}
          confirmLabel="Remove"
          danger
          onConfirm={handleDeleteMember}
          onCancel={() => setConfirmDeleteMember(null)}
        />
      )}
    </>
  );
}
