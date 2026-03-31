import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Flag, Users, DollarSign, ShoppingBag, TrendingUp,
  Calendar, User, Plus, Pencil, Trash2, Info, X, CheckCircle2, Zap,
  Receipt, Loader2, BookOpen, FileDown,
} from 'lucide-react';
import {
  getGroup, finishGroup, addMember, updateMember, deleteMember,
  addGroupExpense, deleteGroupExpense, getDeletedMembers, downloadGroupReport,
} from '../api/groups';
import { getCommonCurrencies, type Currency } from '../api/currencies';
import ConfirmDialog from '../components/ConfirmDialog';
import MemberFormModal, { type MemberForm } from '../components/MemberFormModal';
import { getExpenses, type Expense } from '../api/common';
import { useAuth } from '../context/AuthContext';

const emptyMemberForm: MemberForm = { first_name: '', last_name: '', pax_type: 'A', nationality: undefined, passport: '', date_of_birth: undefined, gender: undefined, date_of_expiry: undefined, comment: undefined, currency_id: undefined, payment: undefined };

export default function GroupDetailPage() {
  const authUser = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const PAX_TYPE_LABELS: Record<string, string> = {
    A: t('groupDetail.paxA'),
    C: t('groupDetail.paxC'),
    I: t('groupDetail.paxI'),
  };

  const [group, setGroup] = useState<any | null>(null);
  const [fetching, setFetching] = useState(true);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);

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

  const [activeTab, setActiveTab] = useState<'members' | 'expenses' | 'deleted'>('members');
  const [deletedMembers, setDeletedMembers] = useState<any[]>([]);
  const [fetchingDeleted, setFetchingDeleted] = useState(false);

  const isAdmin = authUser.user?.type === 'admin' || authUser.user?.type === 'super_admin';

  const loadDeletedMembers = async () => {
    if (!isAdmin) return;
    setFetchingDeleted(true);
    try {
      const data = await getDeletedMembers(id!);
      setDeletedMembers(Array.isArray(data) ? data : []);
    } catch { /* silent */ } finally { setFetchingDeleted(false); }
  };

  const [downloadingReport, setDownloadingReport] = useState(false);

  const handleDownloadReport = async () => {
    setDownloadingReport(true);
    try {
      await downloadGroupReport(id!, `${group?.name ?? 'report'}.xlsx`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('groupDetail.failedReport'));
    } finally {
      setDownloadingReport(false);
    }
  };

  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmDeleteMember, setConfirmDeleteMember] = useState<any | null>(null);
  const [infoMember, setInfoMember] = useState<any | null>(null);

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
    getCommonCurrencies().then(d => setCurrencies(Array.isArray(d) ? d : [])).catch(() => { });
    getExpenses().then(d => setAllExpenses(Array.isArray(d) ? d : [])).catch(() => { });
  }, [id]);

  const handleFinish = async () => {
    try {
      const updated = await finishGroup(id!);
      setGroup((prev: any) => ({ ...prev, is_finished: true, ...updated }));
      toast.success(t('groupDetail.markedFinished'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('groupDetail.failedFinish'));
    } finally { setConfirmFinish(false); }
  };

  const handleAddMember = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setAddingMember(true);
    try {
      const payload: any = { first_name: memberForm.first_name, last_name: memberForm.last_name };
      if (memberForm.pax_type)       payload.pax_type      = memberForm.pax_type;
      if (memberForm.nationality)    payload.nationality   = memberForm.nationality;
      if (memberForm.passport)       payload.passport      = memberForm.passport;
      if (memberForm.date_of_birth)  payload.date_of_birth = memberForm.date_of_birth;
      if (memberForm.gender)         payload.gender        = memberForm.gender;
      if (memberForm.date_of_expiry) payload.date_of_expiry = memberForm.date_of_expiry;
      if (memberForm.comment)        payload.comment       = memberForm.comment;
      if (memberForm.currency_id)    payload.currency_id   = memberForm.currency_id;
      if (memberForm.payment !== undefined) payload.payment = Number(memberForm.payment);
      const newMember = await addMember(id!, payload);
      setGroup((prev: any) => ({ ...prev, groupMember: [...(prev.groupMember ?? []), newMember] }));
      setMemberForm(emptyMemberForm);
      setShowAddModal(false);
      toast.success(t('groupDetail.memberAdded'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('groupDetail.failedAddMember'));
    } finally { setAddingMember(false); }
  };

  const startEdit = (m: any) => {
    setEditingMember(m);
    setEditMemberForm({
      first_name: m.first_name ?? '',
      last_name: m.last_name ?? '',
      pax_type: m.pax_type ?? undefined,
      nationality: m.nationality ?? undefined,
      passport: m.passport ?? '',
      date_of_birth: m.date_of_birth ? m.date_of_birth.slice(0, 10) : undefined,
      gender: m.gender ?? undefined,
      date_of_expiry: m.date_of_expiry ? m.date_of_expiry.slice(0, 10) : undefined,
      comment: m.comment ?? undefined,
      currency_id: m.currency_id ?? undefined,
      payment: m.payment ?? undefined,
    });
  };

  const handleEditMember = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!editingMember) return;
    setSavingMember(true);
    try {
      const payload: any = { first_name: editMemberForm.first_name, last_name: editMemberForm.last_name };
      if (editMemberForm.pax_type)       payload.pax_type      = editMemberForm.pax_type;
      if (editMemberForm.nationality)    payload.nationality   = editMemberForm.nationality;
      if (editMemberForm.passport !== undefined)  payload.passport      = editMemberForm.passport;
      if (editMemberForm.date_of_birth)  payload.date_of_birth = editMemberForm.date_of_birth;
      if (editMemberForm.gender)         payload.gender        = editMemberForm.gender;
      if (editMemberForm.date_of_expiry) payload.date_of_expiry = editMemberForm.date_of_expiry;
      if (editMemberForm.comment)        payload.comment       = editMemberForm.comment;
      if (editMemberForm.currency_id)    payload.currency_id   = editMemberForm.currency_id;
      if (editMemberForm.payment !== undefined)   payload.payment       = Number(editMemberForm.payment);
      const updated = await updateMember(id!, editingMember.id, payload);
      setGroup((prev: any) => ({
        ...prev,
        groupMember: prev.groupMember.map((m: any) => m.id === editingMember.id ? updated : m),
      }));
      setEditingMember(null);
      toast.success(t('groupDetail.memberUpdated'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('groupDetail.failedUpdateMember'));
    } finally { setSavingMember(false); }
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
    } finally { setAddingExpense(false); }
  };

  const handleDeleteExpense = async () => {
    if (!confirmDeleteExpense) return;
    try {
      await deleteGroupExpense(id!, confirmDeleteExpense.id);
      setGroup((prev: any) => ({ ...prev, groupExpenses: prev.groupExpenses.filter((ge: any) => ge.id !== confirmDeleteExpense.id) }));
      toast.success(t('groupDetail.expenseRemoved'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('groupDetail.failedRemoveExpense'));
    } finally { setConfirmDeleteExpense(null); }
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
    } finally { setConfirmDeleteMember(null); }
  };

  if (fetching) {
    return (
      <div className="loading-state" style={{ marginTop: 60 }}>
        <div className="spinner spinner-lg" />
        <span>{t('groupDetail.loading')}</span>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="empty-state" style={{ marginTop: 60 }}>
        <div className="empty-state-icon"><BookOpen size={22} /></div>
        <p>{t('groupDetail.notFound')}</p>
        <button className="btn-secondary" style={{ marginTop: 12 }} onClick={() => navigate('/groups')}>
          <ArrowLeft size={14} />{t('groupDetail.backToGroups')}
        </button>
      </div>
    );
  }

  const members: any[] = group.groupMember ?? [];
  const mainCurrency = currencies.find(c => c.is_main);
  const totalPaymentInMain = members.reduce((sum: number, m: any) => sum + (Number(m.payment) || 0), 0);

  const paymentsByCurrency = Object.values(
    members.reduce((acc: Record<string, { symbol: string; code: string; total: number }>, m: any) => {
      const code = m.currency?.code ?? 'USD';
      const symbol = m.currency?.symbol ?? '$';
      if (!acc[code]) acc[code] = { code, symbol, total: 0 };
      acc[code].total += Number(m.payment) || 0;
      return acc;
    }, {})
  ) as { code: string; symbol: string; total: number }[];

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
    for (const p of paymentsByCurrency) {
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
        <button className="btn-secondary btn-sm" style={{ flexShrink: 0 }} onClick={() => navigate('/groups')}>
          <ArrowLeft size={14} />{t('groupDetail.back')}
        </button>
        <div className="page-title" style={{ marginBottom: 0 }}>
          <h2>{group.name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            {group.date && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                {new Date(group.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
            <span style={{ color: 'var(--border)' }}>·</span>
            <span className={`badge ${group.is_finished ? 'badge-green' : 'badge-yellow'}`}>
              {group.is_finished
                ? <><CheckCircle2 size={10} />{t('groupDetail.statusFinished')}</>
                : <><Zap size={10} />{t('groupDetail.statusActive')}</>
              }
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
                  <User size={11} style={{ color: 'var(--text-muted)' }} />
                  {group.creator.full_name}
                </span>
              </>
            )}
          </div>
        </div>
        <button className="btn-secondary btn-sm" style={{ flexShrink: 0 }} onClick={handleDownloadReport} disabled={downloadingReport}>
          {downloadingReport ? <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} /> : <FileDown size={13} />}
          {t('groupDetail.downloadReport')}
        </button>
        {!group.is_finished && (
          <button className="btn-success btn-sm" style={{ flexShrink: 0 }} onClick={() => setConfirmFinish(true)}>
            <Flag size={13} />{t('groupDetail.finishGroup')}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="stats-bar" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <div className="stat-card" style={{ '--stat-accent': 'var(--purple)' } as React.CSSProperties}>
          <div className="stat-card-head">
            <p className="stat-label">{t('groupDetail.members')}</p>
            <div className="stat-icon" style={{ background: 'var(--purple-light)', color: 'var(--purple)' }}>
              <Users size={18} strokeWidth={2} />
            </div>
          </div>
          <span className="stat-value">{members.length}</span>
        </div>

        {authUser.user?.type !== 'user' && (
          <div className="stat-card" style={{ '--stat-accent': 'var(--info)' } as React.CSSProperties}>
            <div className="stat-card-head">
              <p className="stat-label">{t('groupDetail.totalPayment')}</p>
              <div className="stat-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}>
                <DollarSign size={18} strokeWidth={2} />
              </div>
            </div>
            {members.length === 0 ? (
              <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-muted)' }}>—</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {mainCurrency && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                      {mainCurrency.symbol}{totalPaymentInMain.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{mainCurrency.code}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {(authUser.user?.type === 'super_admin' || authUser.user?.type === 'admin') && (
          <div className="stat-card" style={{ '--stat-accent': 'var(--rose)' } as React.CSSProperties}>
            <div className="stat-card-head">
              <p className="stat-label">{t('groupDetail.totalExpenses')}</p>
              <div className="stat-icon" style={{ background: 'var(--rose-light)', color: 'var(--rose)' }}>
                <ShoppingBag size={18} strokeWidth={2} />
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
          </div>
        )}

        {authUser.user?.type === 'super_admin' && (
          <div className="stat-card" style={{ '--stat-accent': 'var(--success)' } as React.CSSProperties}>
            <div className="stat-card-head">
              <p className="stat-label">{t('groupDetail.profit')}</p>
              <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                <TrendingUp size={18} strokeWidth={2} />
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
          </div>
        )}
      </div>

      {/* Tabbed card */}
      <div className="card">
        <div className="tab-bar">
          <div className="tab-list">
            <button
              className={`tab-btn${activeTab === 'members' ? ' active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              <Users size={14} />
              {t('groupDetail.membersSection')}
              <span className="tab-count">{members.length}</span>
            </button>
            <button
              className={`tab-btn${activeTab === 'expenses' ? ' active' : ''}`}
              onClick={() => setActiveTab('expenses')}
            >
              <Receipt size={14} />
              {t('groupDetail.expensesSection')}
              <span className="tab-count">{(group.groupExpenses ?? []).length}</span>
            </button>
            {isAdmin && (
              <button
                className={`tab-btn${activeTab === 'deleted' ? ' active' : ''}`}
                onClick={() => { setActiveTab('deleted'); loadDeletedMembers(); }}
              >
                <Trash2 size={14} />
                {t('groupDetail.deletedTab')}
                {deletedMembers.length > 0 && <span className="tab-count">{deletedMembers.length}</span>}
              </button>
            )}
          </div>
          {activeTab === 'members' ? (
            <button className="btn-primary btn-sm" onClick={() => { setMemberForm(emptyMemberForm); setShowAddModal(true); }}>
              <Plus size={13} />{t('groupDetail.addMember')}
            </button>
          ) : activeTab === 'expenses' ? (
            <button className="btn-primary btn-sm" onClick={() => { setExpenseId(''); setExpenseValue(''); setShowAddExpense(true); }}>
              <Plus size={13} />{t('groupDetail.addExpense')}
            </button>
          ) : null}
        </div>

        {/* Members tab */}
        {activeTab === 'members' && (
          <>
            <div className="table-wrap">
              {members.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><Users size={22} /></div>
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
                        <td data-label={t('groupDetail.colNo')} style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                        <td data-label={t('groupDetail.colName')}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--purple-light)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                              {m.first_name?.[0]?.toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600 }}>{m.first_name} {m.last_name}</span>
                          </div>
                        </td>
                        <td data-label={t('groupDetail.colPassport')}>
                          <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)', background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>
                            {m.passport || '—'}
                          </span>
                        </td>
                        <td data-label={t('groupDetail.colType')}>
                          {m.pax_type
                            ? <span className="badge badge-blue">{PAX_TYPE_LABELS[m.pax_type] ?? m.pax_type}</span>
                            : <span style={{ color: 'var(--text-muted)' }}>—</span>
                          }
                        </td>
                        <td data-label={t('groupDetail.colPayment')}>
                          <div style={{ fontWeight: 600 }}>
                            {m.payment != null
                              ? `${mainCurrency?.symbol ?? ''}${Number(m.payment).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${mainCurrency?.code ?? ''}`
                              : '—'}
                          </div>
                          {m.currency && !m.currency.is_main && m.original_payment != null && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                              {t('groupDetail.paidIn')} {m.currency.symbol}{Number(m.original_payment).toLocaleString(undefined, { maximumFractionDigits: 2 })} {m.currency.code}
                            </div>
                          )}
                        </td>
                        <td data-label={t('groupDetail.colActions')}>
                          <div className="table-actions">
                            <button className="btn-ghost btn-icon" onClick={() => setInfoMember(m)} title={t('groupDetail.info')}>
                              <Info size={14} />
                            </button>
                            <button className="btn-ghost btn-icon" onClick={() => startEdit(m)} title={t('groupDetail.edit')}>
                              <Pencil size={14} />
                            </button>
                            <button className="btn-danger btn-icon" onClick={() => setConfirmDeleteMember(m)} title={t('groupDetail.delete')}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {members.length > 0 && (
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, fontSize: 13, flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('groupDetail.totalPaymentLabel')}</span>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                  {mainCurrency?.symbol}{totalPaymentInMain.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  <span style={{ fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>{mainCurrency?.code}</span>
                </span>
              </div>
            )}
          </>
        )}

        {/* Deleted tab */}
        {activeTab === 'deleted' && isAdmin && (
          <div className="table-wrap">
            {fetchingDeleted ? (
              <div className="loading-state"><div className="spinner" /><span>{t('groupDetail.loading')}</span></div>
            ) : deletedMembers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Trash2 size={22} /></div>
                <p>{t('groupDetail.noDeletedMembers')}</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>{t('groupDetail.colNo')}</th>
                    <th>{t('groupDetail.colName')}</th>
                    <th>{t('groupDetail.colPayment')}</th>
                    <th>{t('groupDetail.colDeletedBy')}</th>
                    <th>{t('groupDetail.colDeletedAt')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {deletedMembers.map((m: any, i: number) => (
                    <tr key={m.id} style={{ opacity: 0.6 }}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                      <td>
                        <span style={{ fontWeight: 600, textDecoration: 'line-through', color: 'var(--text-secondary)' }}>{m.first_name} {m.last_name}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>
                          {m.payment != null
                            ? `${mainCurrency?.symbol ?? ''}${Number(m.payment).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${mainCurrency?.code ?? ''}`
                            : '—'}
                        </div>
                        {m.currency && !m.currency.is_main && m.original_payment != null && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {t('groupDetail.paidIn')} {m.currency.symbol}{Number(m.original_payment).toLocaleString()} {m.currency.code}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {m.deleter ? m.deleter.full_name : '—'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(m.updated_at).toLocaleString()}
                      </td>
                      <td>
                        <button className="btn-ghost btn-icon" onClick={() => setInfoMember(m)} title={t('groupDetail.info')}>
                          <Info size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Expenses tab */}
        {activeTab === 'expenses' && (
          <div className="table-wrap">
            {(group.groupExpenses ?? []).length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Receipt size={22} /></div>
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
                      <td data-label={t('groupDetail.colNo')} style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                      <td data-label={t('groupDetail.colExpense')} style={{ fontWeight: 600 }}>{ge.expense?.name}</td>
                      <td data-label={t('groupDetail.colCurrency')}>
                        {ge.expense?.currency && (
                          <span className="badge badge-blue">{ge.expense.currency.code}</span>
                        )}
                      </td>
                      <td data-label={t('groupDetail.colValue')} style={{ fontWeight: 700 }}>
                        {ge.expense?.currency?.symbol}{Number(ge.value).toLocaleString()}
                      </td>
                      <td data-label={t('groupDetail.colActions')}>
                        <button className="btn-danger btn-icon" onClick={() => setConfirmDeleteExpense(ge)} title={t('groupDetail.delete')}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddExpense(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-header-title">
                <div className="modal-header-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
                  <Receipt size={18} strokeWidth={2} />
                </div>
                <h3>{t('groupDetail.addExpense')}</h3>
              </div>
              <button className="btn-ghost btn-icon" onClick={() => setShowAddExpense(false)}><X size={16} /></button>
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
                    type="number" min="0" step="0.01"
                    value={expenseValue}
                    onChange={e => setExpenseValue(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                  {selectedExpense && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Default: {selectedExpense.currency?.symbol}{Number(selectedExpense.value).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddExpense(false)}>{t('member.cancel')}</button>
                <button type="submit" className="btn-primary" disabled={addingExpense || !expenseId}>
                  {addingExpense
                    ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />{t('member.saving')}</>
                    : <><Plus size={14} />{t('groupDetail.addExpense')}</>
                  }
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

      {editingMember && (
        <MemberFormModal
          title={t('groupDetail.editMemberTitle', { memberName: `${editingMember.first_name} ${editingMember.last_name}` })}
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

      {/* Info Modal */}
      {infoMember && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setInfoMember(null)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-header-title">
                <div className="modal-header-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                  <Info size={18} strokeWidth={2} />
                </div>
                <h3>{infoMember.first_name} {infoMember.last_name}</h3>
              </div>
              <button className="btn-ghost btn-icon" onClick={() => setInfoMember(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {[
                [t('groupDetail.colPassport'), infoMember.passport || '—'],
                [t('groupDetail.colType'), infoMember.pax_type ? (PAX_TYPE_LABELS[infoMember.pax_type] ?? infoMember.pax_type) : '—'],
                [t('groupDetail.colGender'), infoMember.gender || '—'],
                [t('groupDetail.colNationality'), infoMember.nationality || '—'],
                [t('groupDetail.colDateOfBirth'), infoMember.date_of_birth ? new Date(infoMember.date_of_birth).toLocaleDateString() : '—'],
                [t('groupDetail.colDateOfExpiry'), infoMember.date_of_expiry ? new Date(infoMember.date_of_expiry).toLocaleDateString() : '—'],
                [t('groupDetail.colComment'), infoMember.comment || '—'],
                [t('groupDetail.colPayment'),
                  infoMember.payment != null
                    ? `${mainCurrency?.symbol ?? ''}${Number(infoMember.payment).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${mainCurrency?.code ?? ''}`
                    : '—'
                ],
                ...(infoMember.currency && !infoMember.currency.is_main && infoMember.original_payment != null
                  ? [[t('groupDetail.paidIn'), `${infoMember.currency.symbol}${Number(infoMember.original_payment).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${infoMember.currency.code}`]]
                  : []
                ),
                ...(infoMember.currency && !infoMember.currency.is_main
                  ? [[t('groupDetail.colRate'), `1 ${mainCurrency?.code ?? ''} = ${Number(infoMember.currency_rate).toLocaleString()} ${infoMember.currency.code}`]]
                  : []
                ),
                [t('groupDetail.colCreatedBy'), infoMember.creator?.full_name ?? '—'],
                [t('groupDetail.colCreatedAt'), new Date(infoMember.created_at).toLocaleString()],
                ...(infoMember.is_deleted ? [
                  [t('groupDetail.colDeletedBy'), infoMember.deleter?.full_name ?? '—'],
                  [t('groupDetail.colDeletedAt'), new Date(infoMember.updated_at).toLocaleString()],
                ] : []),
              ].map(([label, value]) => (
                <div key={label as string} className="info-row">
                  <span className="info-row-label">{label}</span>
                  <span className="info-row-value">{value}</span>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setInfoMember(null)}>{t('confirm.cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteMember && (
        <ConfirmDialog
          title={t('groupDetail.confirmRemoveMemberTitle')}
          message={t('groupDetail.confirmRemoveMemberMessage', { name: `${confirmDeleteMember.first_name} ${confirmDeleteMember.last_name}` })}
          confirmLabel={t('groupDetail.delete')}
          danger
          onConfirm={handleDeleteMember}
          onCancel={() => setConfirmDeleteMember(null)}
        />
      )}
    </>
  );
}
