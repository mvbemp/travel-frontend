import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  getExpensesPaginated,
  createExpense,
  updateExpense,
  deleteExpense,
  type Expense,
  type CreateExpenseDto,
} from '../api/expenses';
import { getCurrencies, type Currency } from '../api/currencies';
import ConfirmDialog from '../components/ConfirmDialog';

const emptyForm: CreateExpenseDto = { name: '', currency_id: 0, value: 0 };
const PER_PAGE_OPTIONS = [10, 20, 50];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [form, setForm] = useState<CreateExpenseDto>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const { t } = useTranslation();

  const closeModal = () => { setShowModal(false); setForm(emptyForm); setEditId(null); };

  const load = async (p = page, pp = perPage, s = search) => {
    setFetching(true);
    try {
      const [expData, curData] = await Promise.all([
        getExpensesPaginated(p, pp, s),
        currencies.length === 0 ? getCurrencies() : Promise.resolve(null),
      ]);
      setExpenses(Array.isArray(expData.data) ? expData.data : []);
      setTotal(expData.total ?? 0);
      setPage(expData.page ?? p);
      setLastPage(expData.lastPage ?? 1);
      if (curData !== null) setCurrencies(Array.isArray(curData) ? curData : []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('expenses.failedLoad'));
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { load(page, perPage, search); }, [page, perPage]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); load(1, perPage, value); }, 400);
  };

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
        <div className="stat-card" style={{ '--stat-accent': '#10b981' } as React.CSSProperties}>
          <div className="stat-card-head">
            <p className="stat-label">{t('expenses.total')}</p>
            <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <span className="stat-value">{total}</span>
        </div>
      </div>

      <div className="card">
        <div className="table-header">
          <div><h3>{t('expenses.tableTitle')} <span>({total})</span></h3></div>
          <button className="btn-primary" onClick={openCreate}>
            {t('expenses.newExpense')}
          </button>
        </div>

        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
          <input
            style={{ maxWidth: 360, height: 36 }}
            placeholder={t('expenses.searchPlaceholder')}
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          {fetching ? (
            <div className="empty-state"><span>{t('expenses.loading')}</span></div>
          ) : expenses.length === 0 ? (
            <div className="empty-state">
              <p>{search ? t('expenses.noResults') : t('expenses.noExpenses')}</p>
              <span>{search ? t('expenses.noResultsHint') : t('expenses.noExpensesHint')}</span>
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
                    <td data-label="#">{(page - 1) * perPage + i + 1}</td>
                    <td data-label={t('expenses.colName')} style={{ fontWeight: 500 }}>{e.name}</td>
                    <td data-label={t('expenses.colCurrency')}>
                      <span className="badge badge-blue">{e.currency.code}</span>
                    </td>
                    <td data-label={t('expenses.colValue')} style={{ color: 'var(--text-secondary)' }}>
                      {e.currency.symbol}{parseFloat(e.value).toLocaleString()}
                    </td>
                    <td data-label={t('expenses.colActions')}>
                      <div className="table-actions">
                        <button className="btn-secondary btn-sm" onClick={() => openEdit(e)}>{t('expenses.edit')}</button>
                        <button className="btn-danger btn-sm" onClick={() => setConfirmId(e.id)}>{t('expenses.delete')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!fetching && total > 0 && (
          <div className="pagination">
            <div className="pagination-info">
              {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} / {total}
            </div>
            <div className="pagination-controls">
              <div className="pagination-per-page">
                <span>{t('groups.perPage')}</span>
                <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} style={{ width: 'auto', height: 30, padding: '0 24px 0 8px', fontSize: 12 }}>
                  {PER_PAGE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="pagination-pages">
                <button className="btn-ghost btn-sm pagination-btn" disabled={page <= 1} onClick={() => setPage(1)}>«</button>
                <button className="btn-ghost btn-sm pagination-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{t('groups.prev')}</button>
                {Array.from({ length: lastPage }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === lastPage || Math.abs(p - page) <= 1)
                  .reduce<(number | '…')[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('…');
                    acc.push(p); return acc;
                  }, [])
                  .map((p, i) => p === '…'
                    ? <span key={`e-${i}`} className="pagination-ellipsis">…</span>
                    : <button key={p} className={`btn-sm pagination-btn${page === p ? ' active' : ' btn-ghost'}`} onClick={() => setPage(p as number)}>{p}</button>
                  )}
                <button className="btn-ghost btn-sm pagination-btn" disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}>{t('groups.next')}</button>
                <button className="btn-ghost btn-sm pagination-btn" disabled={page >= lastPage} onClick={() => setPage(lastPage)}>»</button>
              </div>
            </div>
          </div>
        )}
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
