import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  type Expense,
  type CreateExpenseDto,
} from '../api/expenses';
import { getCurrencies, type Currency } from '../api/currencies';
import ConfirmDialog from '../components/ConfirmDialog';

const emptyForm: CreateExpenseDto = { name: '', currency_id: 0, value: 0 };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [form, setForm] = useState<CreateExpenseDto>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const { t } = useTranslation();

  const closeModal = () => { setShowModal(false); setForm(emptyForm); setEditId(null); };

  const load = async () => {
    setFetching(true);
    try {
      const [expData, curData] = await Promise.all([getExpenses(), getCurrencies()]);
      setExpenses(Array.isArray(expData) ? expData : []);
      setCurrencies(Array.isArray(curData) ? curData : []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('expenses.failedLoad'));
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ ...emptyForm, currency_id: currencies[0]?.id ?? 0 });
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (e: Expense) => {
    setForm({ name: e.name, currency_id: e.currency_id, value: parseFloat(e.value) });
    setEditId(e.id);
    setShowModal(true);
  };

  const handleSubmit = async (ev: { preventDefault(): void }) => {
    ev.preventDefault();
    setLoading(true);
    try {
      if (editId !== null) {
        await updateExpense(editId, form);
        toast.success(t('expenses.updated'));
      } else {
        await createExpense(form);
        toast.success(t('expenses.created'));
      }
      closeModal();
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : editId ? t('expenses.failedUpdate') : t('expenses.failedCreate'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast.success(t('expenses.deleted'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('expenses.failedDelete'));
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <>
      <div className="page-title">
        <h2>{t('expenses.pageTitle')}</h2>
        <p>{t('expenses.pageSubtitle')}</p>
      </div>

      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>💰</div>
          <div className="stat-info">
            <p>{t('expenses.total')}</p>
            <span>{expenses.length}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-header">
          <div>
            <h3>{t('expenses.tableTitle')} <span>({expenses.length})</span></h3>
          </div>
          <button className="btn-primary" onClick={openCreate}>
            {t('expenses.newExpense')}
          </button>
        </div>

        <div className="table-wrap">
          {fetching ? (
            <div className="empty-state"><span>{t('expenses.loading')}</span></div>
          ) : expenses.length === 0 ? (
            <div className="empty-state">
              <p>{t('expenses.noExpenses')}</p>
              <span>{t('expenses.noExpensesHint')}</span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('expenses.colName')}</th>
                  <th>{t('expenses.colCurrency')}</th>
                  <th>{t('expenses.colValue')}</th>
                  <th>{t('expenses.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e, i) => (
                  <tr key={e.id}>
                    <td data-label="#">{i + 1}</td>
                    <td data-label={t('expenses.colName')} style={{ fontWeight: 500 }}>{e.name}</td>
                    <td data-label={t('expenses.colCurrency')}>
                      <span className="badge badge-blue">{e.currency.code}</span>
                    </td>
                    <td data-label={t('expenses.colValue')} style={{ color: 'var(--text-secondary)' }}>
                      {e.currency.symbol}{parseFloat(e.value).toLocaleString()}
                    </td>
                    <td data-label={t('expenses.colActions')}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-secondary btn-sm" onClick={() => openEdit(e)}>
                          {t('expenses.edit')}
                        </button>
                        <button className="btn-danger btn-sm" onClick={() => setConfirmId(e.id)}>
                          {t('expenses.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={ev => ev.target === ev.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editId ? t('expenses.modalEditTitle') : t('expenses.modalTitle')}</h3>
              <button className="btn-ghost btn-icon" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>{t('expenses.nameLabel')}</label>
                  <input
                    placeholder={t('expenses.namePlaceholder')}
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('expenses.currencyLabel')}</label>
                    <select
                      value={form.currency_id}
                      onChange={e => setForm({ ...form, currency_id: +e.target.value })}
                      required
                    >
                      {currencies.map(c => (
                        <option key={c.id} value={c.id}>{c.code} — {c.country}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>{t('expenses.valueLabel')}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={form.value}
                      onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>{t('expenses.cancel')}</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? t('expenses.saving') : editId ? t('expenses.saveChanges') : t('expenses.createExpense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmId !== null && (
        <ConfirmDialog
          title={t('expenses.confirmDeleteTitle')}
          message={t('expenses.confirmDeleteMessage')}
          confirmLabel={t('expenses.delete')}
          danger
          onConfirm={() => handleDelete(confirmId!)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </>
  );
}
