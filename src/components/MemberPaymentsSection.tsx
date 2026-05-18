import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Coins, DollarSign, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  createMemberPayment,
  deletePayment,
  listMemberPayments,
  updatePayment,
} from '../api/payments';
import type { Currency } from '../api/currencies';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from './ConfirmDialog';

interface PaymentRow {
  id: number;
  payment: number | string;
  original_payment: number | string;
  currency_id?: number | null;
  currency_rate: number | string;
  main_currency_id?: number | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  currency?: Currency | null;
  mainCurrency?: Currency | null;
  creator?: { id: number; full_name: string } | null;
}

interface MemberPaymentsSectionProps {
  groupId: string | number;
  memberId: number;
  currencies: Currency[];
  initialPayments?: PaymentRow[];
  onChange?: (payments: PaymentRow[]) => void;
}

export default function MemberPaymentsSection({
  groupId,
  memberId,
  currencies,
  initialPayments,
  onChange,
}: MemberPaymentsSectionProps) {
  const { t } = useTranslation();
  const auth = useAuth();
  const currentUserId = auth.user?.id;
  const isAdmin = auth.user?.type === 'admin' || auth.user?.type === 'super_admin';

  const [payments, setPayments] = useState<PaymentRow[]>(initialPayments ?? []);
  const [fetching, setFetching] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [addAmount, setAddAmount] = useState<string>('');
  const [addCurrencyId, setAddCurrencyId] = useState<number | ''>('');
  const [adding, setAdding] = useState(false);

  const [editing, setEditing] = useState<PaymentRow | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editCurrencyId, setEditCurrencyId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<PaymentRow | null>(null);

  const update = (next: PaymentRow[]) => {
    setPayments(next);
    onChange?.(next);
  };

  useEffect(() => {
    if (initialPayments !== undefined) return;
    setFetching(true);
    listMemberPayments(groupId, memberId)
      .then((d: PaymentRow[]) => setPayments(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setFetching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, memberId]);

  const mainCurrency = currencies.find(c => c.is_main);

  const canEdit = (p: PaymentRow) => isAdmin || p.created_by === currentUserId;

  const handleAdd = async () => {
    if (addAmount === '') return;
    setAdding(true);
    try {
      const created: PaymentRow = await createMemberPayment(groupId, memberId, {
        payment: Number(addAmount),
        ...(addCurrencyId ? { currency_id: Number(addCurrencyId) } : {}),
      });
      update([...payments, created]);
      setShowAdd(false);
      setAddAmount('');
      setAddCurrencyId('');
      toast.success(t('payments.added'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('payments.failedAdd'));
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (p: PaymentRow) => {
    setEditing(p);
    setEditAmount(String(Number(p.original_payment)));
    setEditCurrencyId(p.currency_id ?? '');
  };

  const handleEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const updated: PaymentRow = await updatePayment(editing.id, {
        payment: Number(editAmount),
        ...(editCurrencyId ? { currency_id: Number(editCurrencyId) } : {}),
      });
      update(payments.map(p => (p.id === editing.id ? updated : p)));
      setEditing(null);
      toast.success(t('payments.updated'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('payments.failedUpdate'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deletePayment(confirmDelete.id);
      update(payments.filter(p => p.id !== confirmDelete.id));
      toast.success(t('payments.deleted'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('payments.failedDelete'));
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div>
      <div className="form-section-title" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className="section-icon"><DollarSign size={12} /></span>
          {t('payments.sectionTitle')}
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginLeft: 2, letterSpacing: '0.04em' }}>
            ({payments.length})
          </span>
        </span>
        <button
          type="button"
          className="btn-primary btn-sm"
          onClick={() => { setShowAdd(true); setAddAmount(''); setAddCurrencyId(''); }}
        >
          <Plus size={12} /> {t('payments.add')}
        </button>
      </div>

      {fetching ? (
        <div className="loading-state" style={{ padding: 10 }}>
          <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />
          <span>{t('payments.loading')}</span>
        </div>
      ) : payments.length === 0 ? (
        <div className="empty-state" style={{ padding: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('payments.empty')}</span>
        </div>
      ) : (
        <div className="payment-list">
          {payments.map(p => {
            // Use the main currency stored on the payment if present (historical),
            // else fall back to the currently active main currency.
            const paymentMain = p.mainCurrency ?? mainCurrency ?? null;
            const isCrossCurrency =
              !!p.currency && !!paymentMain && p.currency.id !== paymentMain.id;
            const rateNum = Number(p.currency_rate) || 1;
            const originalCode = p.currency?.code ?? paymentMain?.code ?? '';
            const mainCode = paymentMain?.code ?? originalCode;
            return (
            <div key={p.id} className="payment-card">
              <div className="payment-card-body">
                <div className="payment-card-amount">
                  <span className="num">
                    {(p.currency?.symbol ?? paymentMain?.symbol ?? '')}
                    {Number(p.original_payment).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                  <span className="code-chip">{originalCode}</span>
                </div>
                {isCrossCurrency && (
                  <div className="payment-card-eq">
                    <span>
                      ≈ {paymentMain?.symbol}
                      {Number(p.payment).toLocaleString(undefined, { maximumFractionDigits: 2 })}{' '}
                      <span style={{ color: 'var(--text-muted)' }}>{paymentMain?.code}</span>
                    </span>
                  </div>
                )}
                <div className="payment-chips">
                  <span className="payment-chip" title={t('payments.mainCurrency')}>
                    <span className="chip-key">{t('payments.mainCurrency')}:</span>
                    <span>{mainCode}</span>
                  </span>
                  <span className="payment-chip" title={t('payments.rate')}>
                    <span className="chip-key">{t('payments.rate')}:</span>
                    {isCrossCurrency ? (
                      <span>
                        1 {mainCode} = {rateNum.toLocaleString(undefined, { maximumFractionDigits: 5 })} {originalCode}
                      </span>
                    ) : (
                      <span>1.00 ({t('payments.sameAsMain')})</span>
                    )}
                  </span>
                </div>
                <div className="payment-card-meta">
                  {p.creator?.full_name ?? '—'} · {new Date(p.created_at).toLocaleString()}
                </div>
              </div>
              {canEdit(p) && (
                <div className="payment-card-actions">
                  <button
                    type="button"
                    className="btn-ghost btn-icon"
                    onClick={() => startEdit(p)}
                    title={t('payments.edit')}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    className="btn-danger btn-icon"
                    onClick={() => setConfirmDelete(p)}
                    title={t('payments.delete')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <div className="modal-header-title">
                <div className="modal-header-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}>
                  <DollarSign size={18} strokeWidth={2} />
                </div>
                <h3>{t('payments.addTitle')}</h3>
              </div>
              <button type="button" className="btn-ghost btn-icon" onClick={() => setShowAdd(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>{t('member.currency')}</label>
                  <div className="input-with-icon">
                    <span className="input-icon"><Coins size={14} /></span>
                    <select
                      value={addCurrencyId}
                      onChange={e => setAddCurrencyId(e.target.value ? +e.target.value : '')}
                      style={{ paddingLeft: 36 }}
                    >
                      <option value="">{t('member.currency')}</option>
                      {currencies.map(c => (
                        <option key={c.id} value={c.id}>{c.code} — {c.symbol}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('member.payment')}</label>
                  <div className="input-with-icon">
                    <span className="input-icon"><DollarSign size={14} /></span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={addAmount}
                      onChange={e => setAddAmount(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>
                {t('member.cancel')}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleAdd}
                disabled={adding || addAmount === ''}
              >
                {adding ? (
                  <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />{t('member.saving')}</>
                ) : (
                  <><Plus size={14} />{t('payments.add')}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <div className="modal-header-title">
                <div className="modal-header-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}>
                  <DollarSign size={18} strokeWidth={2} />
                </div>
                <h3>{t('payments.editTitle')}</h3>
              </div>
              <button type="button" className="btn-ghost btn-icon" onClick={() => setEditing(null)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>{t('member.currency')}</label>
                  <div className="input-with-icon">
                    <span className="input-icon"><Coins size={14} /></span>
                    <select
                      value={editCurrencyId}
                      onChange={e => setEditCurrencyId(e.target.value ? +e.target.value : '')}
                      style={{ paddingLeft: 36 }}
                    >
                      <option value="">{t('member.currency')}</option>
                      {currencies.map(c => (
                        <option key={c.id} value={c.id}>{c.code} — {c.symbol}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('member.payment')}</label>
                  <div className="input-with-icon">
                    <span className="input-icon"><DollarSign size={14} /></span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={editAmount}
                      onChange={e => setEditAmount(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
                {t('member.cancel')}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleEdit}
                disabled={saving || editAmount === ''}
              >
                {saving ? (
                  <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />{t('member.saving')}</>
                ) : (
                  t('groupDetail.saveChanges')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={t('payments.confirmDeleteTitle')}
          message={t('payments.confirmDeleteMessage')}
          confirmLabel={t('payments.delete')}
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

export type { PaymentRow };
