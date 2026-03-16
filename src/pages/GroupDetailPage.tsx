import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  getGroup, finishGroup, addMember, updateMember, deleteMember,
} from '../api/groups';
import ConfirmDialog from '../components/ConfirmDialog';
import MemberFormModal, { type MemberForm } from '../components/MemberFormModal';

const emptyMemberForm: MemberForm = { name: '', passport: '', passport_type: undefined, payment: undefined };

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const PASSPORT_LABELS: Record<string, string> = {
    green_passport: t('groupDetail.passportGreen'),
    red_passport: t('groupDetail.passportRed'),
    id_card: t('groupDetail.passportId'),
  };

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
      toast.error(err instanceof Error ? err.message : t('groupDetail.failedLoad'));
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleFinish = async () => {
    try {
      const updated = await finishGroup(id!);
      setGroup((prev: any) => ({ ...prev, is_finished: true, ...updated }));
      toast.success(t('groupDetail.markedFinished'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('groupDetail.failedFinish'));
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
      toast.success(t('groupDetail.memberAdded'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('groupDetail.failedAddMember'));
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
      toast.success(t('groupDetail.memberUpdated'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('groupDetail.failedUpdateMember'));
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
      toast.success(t('groupDetail.memberRemoved'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('groupDetail.failedRemoveMember'));
    } finally {
      setConfirmDeleteMember(null);
    }
  };

  if (fetching) {
    return <div className="empty-state" style={{ marginTop: 60 }}><span>{t('groupDetail.loading')}</span></div>;
  }

  if (!group) {
    return (
      <div className="empty-state" style={{ marginTop: 60 }}>
        <p>{t('groupDetail.notFound')}</p>
        <button className="btn-secondary" style={{ marginTop: 12 }} onClick={() => navigate('/groups')}>{t('groupDetail.backToGroups')}</button>
      </div>
    );
  }

  const members: any[] = group.groupMember ?? [];
  const totalPayment = members.reduce((s: number, m: any) => s + (Number(m.payment) || 0), 0);

  return (
    <>
      {/* Back + title row */}
      <div className="detail-title-row">
        <button className="btn-ghost btn-sm" style={{ flexShrink: 0 }} onClick={() => navigate('/groups')}>{t('groupDetail.back')}</button>
        <div className="page-title">
          <h2>{group.name}</h2>
          {group.description && <p>{group.description}</p>}
        </div>
        {!group.is_finished && (
          <button className="btn-success btn-sm" style={{ flexShrink: 0 }} onClick={() => setConfirmFinish(true)}>{t('groupDetail.finishGroup')}</button>
        )}
      </div>

      {/* Info cards */}
      <div className="stats-bar" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>📅</div>
          <div className="stat-info">
            <p>{t('groupDetail.date')}</p>
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
            <p>{t('groupDetail.status')}</p>
            <span>
              <span className={`badge ${group.is_finished ? 'badge-green' : 'badge-yellow'}`}>
                {group.is_finished ? t('groupDetail.statusFinished') : t('groupDetail.statusActive')}
              </span>
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f0fdf4' }}>👤</div>
          <div className="stat-info"><p>{t('groupDetail.members')}</p><span>{members.length}</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>💰</div>
          <div className="stat-info">
            <p>{t('groupDetail.totalPayment')}</p>
            <span style={{ fontSize: 14 }}>${totalPayment.toLocaleString()}</span>
          </div>
        </div>
        {group.creator && (
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>🛡️</div>
            <div className="stat-info">
              <p>{t('groupDetail.createdBy')}</p>
              <span style={{ fontSize: 13 }}>{group.creator.full_name}</span>
            </div>
          </div>
        )}
      </div>

      {/* Members table */}
      <div className="card">
        <div className="table-header">
          <div><h3>{t('groupDetail.membersSection')} <span>({members.length})</span></h3></div>
          <button className="btn-primary" onClick={() => { setMemberForm(emptyMemberForm); setShowAddModal(true); }}>
            {t('groupDetail.addMember')}
          </button>
        </div>

        <div className="table-wrap">
          {members.length === 0 ? (
            <div className="empty-state">
              <p>{t('groupDetail.noMembers')}</p>
              <span>{t('groupDetail.noMembersHint')}</span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t('groupDetail.colNo')}</th>
                  <th>{t('groupDetail.colName')}</th>
                  <th>{t('groupDetail.colPassport')}</th>
                  <th>{t('groupDetail.colType')}</th>
                  <th>{t('groupDetail.colPayment')}</th>
                  <th>{t('groupDetail.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m: any, i: number) => (
                  <tr key={m.id}>
                    <td data-label={t('groupDetail.colNo')} style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td data-label={t('groupDetail.colName')} style={{ fontWeight: 500 }}>{m.name}</td>
                    <td data-label={t('groupDetail.colPassport')} style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{m.passport || '—'}</td>
                    <td data-label={t('groupDetail.colType')}>
                      {m.passport_type
                        ? <span className="badge badge-blue">{PASSPORT_LABELS[m.passport_type] ?? m.passport_type}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td data-label={t('groupDetail.colPayment')} style={{ fontWeight: 500 }}>
                      {m.payment != null ? `$${Number(m.payment).toLocaleString()}` : '—'}
                    </td>
                    <td data-label={t('groupDetail.colActions')}>
                      <div className="table-actions">
                        <button className="btn-ghost btn-sm" onClick={() => startEdit(m)}>{t('groupDetail.edit')}</button>
                        <button className="btn-danger btn-sm" onClick={() => setConfirmDeleteMember(m)}>{t('groupDetail.delete')}</button>
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
            <span>{t('groupDetail.totalPaymentLabel')}</span>
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>${totalPayment.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Add member modal */}
      {showAddModal && (
        <MemberFormModal
          title={t('groupDetail.addMemberTitle')}
          form={memberForm}
          loading={addingMember}
          submitLabel={t('groupDetail.addMember')}
          onSubmit={handleAddMember}
          onChange={setMemberForm}
          onClose={() => { setShowAddModal(false); setMemberForm(emptyMemberForm); }}
        />
      )}

      {/* Edit member modal */}
      {editingMember && (
        <MemberFormModal
          title={t('groupDetail.editMemberTitle', { memberName: editingMember.name })}
          form={editMemberForm}
          loading={savingMember}
          submitLabel={t('groupDetail.saveChanges')}
          onSubmit={handleEditMember}
          onChange={setEditMemberForm}
          onClose={() => setEditingMember(null)}
        />
      )}

      {confirmFinish && (
        <ConfirmDialog
          title={t('groupDetail.confirmFinishTitle')}
          message={t('groupDetail.confirmFinishMessage')}
          confirmLabel={t('groups.finish')}
          onConfirm={handleFinish}
          onCancel={() => setConfirmFinish(false)}
        />
      )}

      {confirmDeleteMember && (
        <ConfirmDialog
          title={t('groupDetail.confirmRemoveMemberTitle')}
          message={t('groupDetail.confirmRemoveMemberMessage', { name: confirmDeleteMember.name })}
          confirmLabel={t('groupDetail.delete')}
          danger
          onConfirm={handleDeleteMember}
          onCancel={() => setConfirmDeleteMember(null)}
        />
      )}
    </>
  );
}
