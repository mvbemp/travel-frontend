import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  getGroup, finishGroup, addMember, updateMember, deleteMember,
} from '../api/groups';
import { getCurrencies, type Currency } from '../api/currencies';
import ConfirmDialog from '../components/ConfirmDialog';
import MemberFormModal, { type MemberForm } from '../components/MemberFormModal';

const emptyMemberForm: MemberForm = { name: '', passport: '', passport_type: undefined, currency_id: undefined, payment: undefined };

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
  const [currencies, setCurrencies] = useState<Currency[]>([]);

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

  useEffect(() => {
    load();
    getCurrencies().then(d => setCurrencies(Array.isArray(d) ? d : [])).catch(() => {});
  }, [id]);

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
      if (memberForm.currency_id) payload.currency_id = memberForm.currency_id;
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
    setEditMemberForm({ name: m.name, passport: m.passport ?? '', passport_type: m.passport_type ?? undefined, currency_id: m.currency_id ?? undefined, payment: m.payment ?? undefined });
  };

  const handleEditMember = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!editingMember) return;
    setSavingMember(true);
    try {
      const payload: any = { name: editMemberForm.name };
      if (editMemberForm.passport !== undefined) payload.passport = editMemberForm.passport;
      if (editMemberForm.passport_type) payload.passport_type = editMemberForm.passport_type;
      if (editMemberForm.currency_id) payload.currency_id = editMemberForm.currency_id;
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

  const paymentsByCurrency = Object.values(
    members.reduce((acc: Record<string, { symbol: string; code: string; total: number }>, m: any) => {
      const code = m.currency?.code ?? 'USD';
      const symbol = m.currency?.symbol ?? '$';
      if (!acc[code]) acc[code] = { code, symbol, total: 0 };
      acc[code].total += Number(m.payment) || 0;
      return acc;
    }, {})
  );

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

      {/* Info strip */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        display: 'flex',
        flexWrap: 'wrap',
        marginBottom: 24,
        overflow: 'hidden',
      }}>
        {/* Date */}
        <div style={{ flex: '1 1 160px', padding: '16px 20px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{t('groupDetail.date')}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            {group.date ? new Date(group.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
          </div>
        </div>

        {/* Status */}
        <div style={{ flex: '1 1 140px', padding: '16px 20px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{t('groupDetail.status')}</div>
          <span className={`badge ${group.is_finished ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: 12 }}>
            {group.is_finished ? t('groupDetail.statusFinished') : t('groupDetail.statusActive')}
          </span>
        </div>

        {/* Members */}
        <div style={{ flex: '1 1 120px', padding: '16px 20px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{t('groupDetail.members')}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{members.length}</div>
        </div>

        {/* Total Payment */}
        <div style={{ flex: '1 1 180px', padding: '16px 20px', borderRight: group.creator ? '1px solid var(--border)' : undefined, borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{t('groupDetail.totalPayment')}</div>
          {paymentsByCurrency.length === 0 ? (
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-muted)' }}>—</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {paymentsByCurrency.map(({ code, total }) => (
                <div key={code} style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>
                  {total.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>{code}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Creator */}
        {group.creator && (
          <div style={{ flex: '1 1 160px', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{t('groupDetail.createdBy')}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{group.creator.full_name}</div>
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
                      {m.payment != null ? `${m.currency?.symbol ?? '$'}${Number(m.payment).toLocaleString()}` : '—'}
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
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
            <span>{t('groupDetail.totalPaymentLabel')}</span>
            {paymentsByCurrency.map(({ code, symbol, total }, i) => (
              <span key={code}>
                {i > 0 && <span style={{ marginRight: 8, color: 'var(--border)' }}>·</span>}
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>{symbol}{total.toLocaleString()}</span>
                {' '}<span style={{ color: 'var(--text-muted)' }}>{code}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Add member modal */}
      {showAddModal && (
        <MemberFormModal
          title={t('groupDetail.addMemberTitle')}
          form={memberForm}
          currencies={currencies}
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
          currencies={currencies}
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
