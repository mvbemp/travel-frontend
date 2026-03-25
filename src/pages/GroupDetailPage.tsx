import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  getGroup, finishGroup, addMember, updateMember, deleteMember,
  addGroupExpense, deleteGroupExpense,
} from '../api/groups';
import { getCurrencies, type Currency } from '../api/currencies';

import ConfirmDialog from '../components/ConfirmDialog';
import MemberFormModal, { type MemberForm } from '../components/MemberFormModal';
import { getExpenses, type Expense } from '../api/common';
import { useAuth } from '../context/AuthContext';

const emptyMemberForm: MemberForm = { name: '', passport: '', passport_type: undefined, currency_id: undefined, payment: undefined };

export default function GroupDetailPage() {
  const authUser = useAuth()
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
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);

  // expense form
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseId, setExpenseId] = useState<number | ''>('');
  const [expenseValue, setExpenseValue] = useState('');
  const [addingExpense, setAddingExpense] = useState(false);
  const [confirmDeleteExpense, setConfirmDeleteExpense] = useState<any | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [memberForm, setMemberForm] = useState<MemberForm>(emptyMemberForm);
  const [addingMember, setAddingMember] = useState(false);

  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [editMemberForm, setEditMemberForm] = useState<MemberForm>(emptyMemberForm);
  const [savingMember, setSavingMember] = useState(false);

  const [activeTab, setActiveTab] = useState<'members' | 'expenses'>('members');
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
    getCurrencies().then(d => setCurrencies(Array.isArray(d) ? d : [])).catch(() => { });
    getExpenses().then(d => setAllExpenses(Array.isArray(d) ? d : [])).catch(() => { });
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

  const selectedExpense = allExpenses.find(e => e.id === expenseId);

  const handleExpenseSelect = (eid: number | '') => {
    setExpenseId(eid);
    if (eid !== '') {
      const exp = allExpenses.find(e => e.id === eid);
      if (exp) setExpenseValue(String(Number(exp.value)));
    } else {
      setExpenseValue('');
    }
  };

  const handleAddExpense = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!expenseId) return;
    setAddingExpense(true);
    try {
      const added = await addGroupExpense(id!, { expense_id: Number(expenseId), value: Number(expenseValue) });
      setGroup((prev: any) => ({ ...prev, groupExpenses: [...(prev.groupExpenses ?? []), added] }));
      setShowAddExpense(false);
      setExpenseId('');
      setExpenseValue('');
      toast.success(t('groupDetail.expenseAdded'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('groupDetail.failedAddExpense'));
    } finally {
      setAddingExpense(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!confirmDeleteExpense) return;
    try {
      await deleteGroupExpense(id!, confirmDeleteExpense.id);
      setGroup((prev: any) => ({ ...prev, groupExpenses: prev.groupExpenses.filter((ge: any) => ge.id !== confirmDeleteExpense.id) }));
      toast.success(t('groupDetail.expenseRemoved'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('groupDetail.failedRemoveExpense'));
    } finally {
      setConfirmDeleteExpense(null);
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

  const expensesByCurrency = Object.values(
    (group.groupExpenses ?? []).reduce((acc: Record<string, { symbol: string; code: string; total: number }>, ge: any) => {
      const code = ge.expense?.currency?.code ?? 'USD';
      const symbol = ge.expense?.currency?.symbol ?? '$';
      if (!acc[code]) acc[code] = { code, symbol, total: 0 };
      acc[code].total += Number(ge.value) || 0;
      return acc;
    }, {})
  ) as { code: string; symbol: string; total: number }[];

  const profitByCurrency = (() => {
    const map: Record<string, { code: string; symbol: string; profit: number }> = {};
    for (const p of paymentsByCurrency as { code: string; symbol: string; total: number }[]) {
      if (!map[p.code]) map[p.code] = { code: p.code, symbol: p.symbol, profit: 0 };
      map[p.code].profit += p.total;
    }
    for (const e of expensesByCurrency) {
      if (!map[e.code]) map[e.code] = { code: e.code, symbol: e.symbol, profit: 0 };
      map[e.code].profit -= e.total;
    }
    return Object.values(map);
  })();

  return (
    <>
      {/* Back + title row */}
      <div className="detail-title-row">
        <button className="btn-ghost btn-sm" style={{ flexShrink: 0 }} onClick={() => navigate('/groups')}>{t('groupDetail.back')}</button>
        <div className="page-title" style={{ marginBottom: 0 }}>
          <h2>{group.name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            {group.date && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                {new Date(group.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
            <span style={{ color: 'var(--border)' }}>·</span>
            <span className={`badge ${group.is_finished ? 'badge-green' : 'badge-yellow'}`}>
              {group.is_finished ? t('groupDetail.statusFinished') : t('groupDetail.statusActive')}
            </span>
            {group.description && (
              <>
                <span style={{ color: 'var(--border)' }}>·</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{group.description}</span>
              </>
            )}
            {group.creator && (
              <>
                <span style={{ color: 'var(--border)' }}>·</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  {group.creator.full_name}
                </span>
              </>
            )}
          </div>
        </div>
        {!group.is_finished && (
          <button className="btn-success btn-sm" style={{ flexShrink: 0 }} onClick={() => setConfirmFinish(true)}>{t('groupDetail.finishGroup')}</button>
        )}
      </div>

      {/* Info cards */}
      <div className="stats-bar" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>

        {/* Members */}
        <div className="stat-card" style={{ '--stat-accent': '#8b5cf6' } as React.CSSProperties}>
          <div className="stat-card-head">
            <p className="stat-label">{t('groupDetail.members')}</p>
            <div className="stat-icon" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
          </div>
          <span className="stat-value">{members.length}</span>
        </div>

        {/* Total Payment */}
        {
          authUser.user?.type !== 'user' ?
            <div className="stat-card" style={{ '--stat-accent': '#0ea5e9' } as React.CSSProperties}>
              <div className="stat-card-head">
                <p className="stat-label">{t('groupDetail.totalPayment')}</p>
                <div className="stat-icon" style={{ background: '#f0f9ff', color: '#0ea5e9' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                </div>
              </div>
              {paymentsByCurrency.length === 0 ? (
                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-muted)' }}>—</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {(paymentsByCurrency as { code: string; symbol: string; total: number }[]).map(({ code, symbol, total }) => (
                    <div key={code} style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{symbol}{total.toLocaleString()}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{code}</span>
                    </div>
                  ))}
                </div>
              )}
            </div> : null
        }

        {/* Total Expenses */}
        {
          authUser.user?.type === 'super_admin' || authUser.user?.type === 'admin' ?
            <div className="stat-card" style={{ '--stat-accent': '#f43f5e' } as React.CSSProperties}>
              <div className="stat-card-head">
                <p className="stat-label">{t('groupDetail.totalExpenses')}</p>
                <div className="stat-icon" style={{ background: '#fff1f2', color: '#f43f5e' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                </div>
              </div>
              {expensesByCurrency.length === 0 ? (
                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-muted)' }}>—</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {expensesByCurrency.map(({ code, symbol, total }) => (
                    <div key={code} style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{symbol}{total.toLocaleString()}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{code}</span>
                    </div>
                  ))}
                </div>
              )}
            </div> : null
        }

        {/* Profit */}
        {
          authUser.user?.type === 'super_admin' ?
            <div className="stat-card" style={{ '--stat-accent': '#22c55e' } as React.CSSProperties}>
              <div className="stat-card-head">
                <p className="stat-label">{t('groupDetail.profit')}</p>
                <div className="stat-icon" style={{ background: '#f0fdf4', color: '#22c55e' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
                </div>
              </div>
              {profitByCurrency.length === 0 ? (
                <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-muted)' }}>—</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {profitByCurrency.map(({ code, symbol, profit }) => (
                    <div key={code} style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {profit >= 0 ? '+' : ''}{symbol}{profit.toLocaleString()}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{code}</span>
                    </div>
                  ))}
                </div>
              )}
            </div> : null
        }

      </div>

      {/* Tabbed card */}
      <div className="card">
        {/* Tab header */}
        <div className="tab-bar">
          <div className="tab-list">
            <button
              className={`tab-btn${activeTab === 'members' ? ' active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              {t('groupDetail.membersSection')}
              <span className="tab-count">{members.length}</span>
            </button>
            <button
              className={`tab-btn${activeTab === 'expenses' ? ' active' : ''}`}
              onClick={() => setActiveTab('expenses')}
            >
              {t('groupDetail.expensesSection')}
              <span className="tab-count">{(group.groupExpenses ?? []).length}</span>
            </button>
          </div>
          {activeTab === 'members' ? (
            <button className="btn-primary" onClick={() => { setMemberForm(emptyMemberForm); setShowAddModal(true); }}>
              {t('groupDetail.addMember')}
            </button>
          ) : (
            <button className="btn-primary" onClick={() => { setExpenseId(''); setExpenseValue(''); setShowAddExpense(true); }}>
              {t('groupDetail.addExpense')}
            </button>
          )}
        </div>

        {/* Members tab */}
        {activeTab === 'members' && (
          <>
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
                {(paymentsByCurrency as { code: string; symbol: string; total: number }[]).map(({ code, symbol, total }, i) => (
                  <span key={code}>
                    {i > 0 && <span style={{ marginRight: 8, color: 'var(--border)' }}>·</span>}
                    <span style={{ fontWeight: 700, color: 'var(--text)' }}>{symbol}{total.toLocaleString()}</span>
                    {' '}<span style={{ color: 'var(--text-muted)' }}>{code}</span>
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {/* Expenses tab */}
        {activeTab === 'expenses' && (
          <div className="table-wrap">
            {(group.groupExpenses ?? []).length === 0 ? (
              <div className="empty-state">
                <p>{t('groupDetail.noExpenses')}</p>
                <span>{t('groupDetail.noExpensesHint')}</span>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>{t('groupDetail.colNo')}</th>
                    <th>{t('groupDetail.colExpense')}</th>
                    <th>{t('groupDetail.colCurrency')}</th>
                    <th>{t('groupDetail.colValue')}</th>
                    <th>{t('groupDetail.colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(group.groupExpenses as any[]).map((ge: any, i: number) => (
                    <tr key={ge.id}>
                      <td data-label={t('groupDetail.colNo')} style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td data-label={t('groupDetail.colExpense')} style={{ fontWeight: 500 }}>{ge.expense?.name}</td>
                      <td data-label={t('groupDetail.colCurrency')}>
                        {ge.expense?.currency && (
                          <span className="badge badge-blue">{ge.expense.currency.code}</span>
                        )}
                      </td>
                      <td data-label={t('groupDetail.colValue')} style={{ fontWeight: 500 }}>
                        {ge.expense?.currency?.symbol}{Number(ge.value).toLocaleString()}
                      </td>
                      <td data-label={t('groupDetail.colActions')}>
                        <button className="btn-danger btn-sm" onClick={() => setConfirmDeleteExpense(ge)}>{t('groupDetail.delete')}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Add expense modal */}
      {showAddExpense && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddExpense(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{t('groupDetail.addExpense')}</h3>
              <button className="btn-ghost btn-icon" onClick={() => setShowAddExpense(false)}>✕</button>
            </div>
            <form onSubmit={handleAddExpense}>
              <div className="modal-body">
                <div className="form-group">
                  <label>{t('groupDetail.colExpense')}</label>
                  <select
                    value={expenseId}
                    onChange={e => handleExpenseSelect(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                  >
                    <option value="">{t('groupDetail.selectExpense')}</option>
                    {allExpenses.map(exp => (
                      <option key={exp.id} value={exp.id}>
                        {exp.name} ({exp.currency?.symbol}{Number(exp.value).toLocaleString()} {exp.currency?.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('groupDetail.expenseValue')}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={expenseValue}
                    onChange={e => setExpenseValue(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                  {selectedExpense && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Default: {selectedExpense.currency?.symbol}{Number(selectedExpense.value).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddExpense(false)}>{t('member.cancel')}</button>
                <button type="submit" className="btn-primary" disabled={addingExpense || !expenseId}>
                  {addingExpense ? t('member.saving') : t('groupDetail.addExpense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteExpense && (
        <ConfirmDialog
          title={t('groupDetail.confirmRemoveExpenseTitle')}
          message={t('groupDetail.confirmRemoveExpenseMessage', { name: confirmDeleteExpense.expense?.name })}
          confirmLabel={t('groupDetail.delete')}
          danger
          onConfirm={handleDeleteExpense}
          onCancel={() => setConfirmDeleteExpense(null)}
        />
      )}

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
