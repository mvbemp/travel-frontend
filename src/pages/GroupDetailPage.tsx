import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  getGroup, finishGroup, addMember, updateMember, deleteMember,
} from '../api/groups';
import ConfirmDialog from '../components/ConfirmDialog';
import MemberFormModal, { type MemberForm } from '../components/MemberFormModal';

const emptyMemberForm: MemberForm = { name: '', passport: '', passport_type: undefined, payment: undefined };

const PASSPORT_LABELS: Record<string, string> = {
  green_passport: 'Green Passport',
  red_passport: 'Red Passport',
  id_card: 'ID Card',
};

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [group, setGroup] = useState<any | null>(null);
  const [fetching, setFetching] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [memberForm, setMemberForm] = useState<MemberForm>(emptyMemberForm);
  const [addingMember, setAddingMember] = useState(false);

  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [editMemberForm, setEditMemberForm] = useState<MemberForm>(emptyMemberForm);
  const [savingMember, setSavingMember] = useState(false);

  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmDeleteMember, setConfirmDeleteMember] = useState<any | null>(null);

  const load = async () => {
    setFetching(true);
    try {
      const data = await getGroup(id!);
      setGroup(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load group');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleFinish = async () => {
    try {
      const updated = await finishGroup(id!);
      setGroup((prev: any) => ({ ...prev, is_finished: true, ...updated }));
      toast.success('Group marked as finished');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to finish group');
    } finally {
      setConfirmFinish(false);
    }
  };

  const handleAddMember = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setAddingMember(true);
    try {
      const payload: any = { name: memberForm.name };
      if (memberForm.passport) payload.passport = memberForm.passport;
      if (memberForm.passport_type) payload.passport_type = memberForm.passport_type;
      if (memberForm.payment !== undefined) payload.payment = Number(memberForm.payment);

      const newMember = await addMember(id!, payload);
      setGroup((prev: any) => ({ ...prev, groupMember: [...(prev.groupMember ?? []), newMember] }));
      setMemberForm(emptyMemberForm);
      setShowAddModal(false);
      toast.success('Member added');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const startEdit = (m: any) => {
    setEditingMember(m);
    setEditMemberForm({ name: m.name, passport: m.passport ?? '', passport_type: m.passport_type ?? undefined, payment: m.payment ?? undefined });
  };

  const handleEditMember = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!editingMember) return;
    setSavingMember(true);
    try {
      const payload: any = { name: editMemberForm.name };
      if (editMemberForm.passport !== undefined) payload.passport = editMemberForm.passport;
      if (editMemberForm.passport_type) payload.passport_type = editMemberForm.passport_type;
      if (editMemberForm.payment !== undefined) payload.payment = Number(editMemberForm.payment);

      const updated = await updateMember(id!, editingMember.id, payload);
      setGroup((prev: any) => ({
        ...prev,
        groupMember: prev.groupMember.map((m: any) => m.id === editingMember.id ? updated : m),
      }));
      setEditingMember(null);
      toast.success('Member updated');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update member');
    } finally {
      setSavingMember(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!confirmDeleteMember) return;
    try {
      await deleteMember(id!, confirmDeleteMember.id);
      setGroup((prev: any) => ({
        ...prev,
        groupMember: prev.groupMember.filter((m: any) => m.id !== confirmDeleteMember.id),
      }));
      toast.success('Member removed');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setConfirmDeleteMember(null);
    }
  };

  if (fetching) {
    return <div className="empty-state" style={{ marginTop: 60 }}><span>Loading group…</span></div>;
  }

  if (!group) {
    return (
      <div className="empty-state" style={{ marginTop: 60 }}>
        <p>Group not found</p>
        <button className="btn-secondary" style={{ marginTop: 12 }} onClick={() => navigate('/groups')}>← Back to Groups</button>
      </div>
    );
  }

  const members: any[] = group.groupMember ?? [];
  const totalPayment = members.reduce((s: number, m: any) => s + (Number(m.payment) || 0), 0);

  return (
    <>
      {/* Back + title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn-ghost btn-sm" onClick={() => navigate('/groups')}>← Back</button>
        <div className="page-title" style={{ margin: 0, flex: 1 }}>
          <h2>{group.name}</h2>
          {group.description && <p>{group.description}</p>}
        </div>
        {!group.is_finished && (
          <button className="btn-success btn-sm" onClick={() => setConfirmFinish(true)}>✓ Finish Group</button>
        )}
      </div>

      {/* Info cards */}
      <div className="stats-bar" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>📅</div>
          <div className="stat-info">
            <p>Date</p>
            <span style={{ fontSize: 14 }}>
              {group.date ? new Date(group.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: group.is_finished ? 'var(--success-light)' : 'var(--warning-light)' }}>
            {group.is_finished ? '✅' : '🔄'}
          </div>
          <div className="stat-info">
            <p>Status</p>
            <span>
              <span className={`badge ${group.is_finished ? 'badge-green' : 'badge-yellow'}`}>
                {group.is_finished ? 'Finished' : 'Active'}
              </span>
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f0fdf4' }}>👤</div>
          <div className="stat-info"><p>Members</p><span>{members.length}</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>💰</div>
          <div className="stat-info">
            <p>Total Payment</p>
            <span style={{ fontSize: 14 }}>${totalPayment.toLocaleString()}</span>
          </div>
        </div>
        {group.creator && (
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>🛡️</div>
            <div className="stat-info">
              <p>Created By</p>
              <span style={{ fontSize: 13 }}>{group.creator.full_name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Members table */}
      <div className="card">
        <div className="table-header">
          <div><h3>Members <span>({members.length})</span></h3></div>
          <button className="btn-primary" onClick={() => { setMemberForm(emptyMemberForm); setShowAddModal(true); }}>
            + Add Member
          </button>
        </div>

        <div className="table-wrap">
          {members.length === 0 ? (
            <div className="empty-state">
              <p>No members yet</p>
              <span>Add the first member to this group</span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Passport No.</th>
                  <th>Type</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m: any, i: number) => (
                  <tr key={m.id}>
                    <td data-label="#" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td data-label="Name" style={{ fontWeight: 500 }}>{m.name}</td>
                    <td data-label="Passport" style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{m.passport || '—'}</td>
                    <td data-label="Type">
                      {m.passport_type
                        ? <span className="badge badge-blue">{PASSPORT_LABELS[m.passport_type] ?? m.passport_type}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td data-label="Payment" style={{ fontWeight: 500 }}>
                      {m.payment != null ? `$${Number(m.payment).toLocaleString()}` : '—'}
                    </td>
                    <td data-label="Actions">
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-ghost btn-sm" onClick={() => startEdit(m)}>✏️ Edit</button>
                        <button className="btn-danger btn-sm" onClick={() => setConfirmDeleteMember(m)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {members.length > 0 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
            <span>Total payment:</span>
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>${totalPayment.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Add member modal */}
      {showAddModal && (
        <MemberFormModal
          title="Add Member"
          form={memberForm}
          loading={addingMember}
          submitLabel="Add Member"
          onSubmit={handleAddMember}
          onChange={setMemberForm}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit member modal */}
      {editingMember && (
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

      {confirmFinish && (
        <ConfirmDialog
          title="Finish Group"
          message="Mark this group as finished? This cannot be reversed."
          confirmLabel="Finish"
          onConfirm={handleFinish}
          onCancel={() => setConfirmFinish(false)}
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
