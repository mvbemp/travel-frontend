import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  Receipt, Plus, Search, Pencil, Trash2, X, Loader2, Tag, Coins,
} from 'lucide-react';
import {
  getExpensesPaginated, createExpense, updateExpense, deleteExpense,
  type Expense, type CreateExpenseDto,
} from '../api/expenses';
import { getCurrencies, type Currency } from '../api/currencies';
import ConfirmDialog from '../components/ConfirmDialog';
import { Pagination } from './UsersPage';

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
        <div className="stat-card" style={{ '--stat-accent': 'var(--warning)' } as React.CSSProperties}>
          <div className="stat-card-head">
            <p className="stat-label">{t('expenses.total')}</p>
            <div className="stat-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
              <Receipt size={20} strokeWidth={2} />
            </div>
          </div>
          <span className="stat-value">{total}</span>
        </div>
      </div>

      <div className="card">
        <div className="table-header">
          <div className="table-header-left">
            <h3>{t('expenses.tableTitle')}</h3>
            <span className="table-header-sub">{total} {t('expenses.total').toLowerCase()}</span>
          </div>
          <div className="table-header-actions">
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={15} />{t('expenses.newExpense')}
            </button>
          </div>
        </div>

        <div className="search-bar">
          <div className="input-with-icon search-input">
            <span className="input-icon"><Search size={14} /></span>
            <input
              placeholder={t('expenses.searchPlaceholder')}
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              style={{ height: 36 }}
            />
          </div>
        </div>

        <div className="table-wrap">
          {fetching ? (
            <div className="loading-state">
              <div className="spinner spinner-lg" />
              <span>{t('expenses.loading')}</span>
            </div>
          ) : expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Receipt size={22} /></div>
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
                    <td data-label="#" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{(page - 1) * perPage + i + 1}</td>
                    <td data-label={t('expenses.colName')}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 600 }}>
                        <Tag size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        {e.name}
                      </span>
                    </td>
                    <td data-label={t('expenses.colCurrency')}>
                      <span className="badge badge-blue">
                        <Coins size={10} />{e.currency.code}
                      </span>
                    </td>
                    <td data-label={t('expenses.colValue')}>
                      <span style={{ fontWeight: 700, color: 'var(--text)' }}>
                        {e.currency.symbol}{parseFloat(e.value).toLocaleString()}
                      </span>
                    </td>
                    <td data-label={t('expenses.colActions')}>
                      <div className="table-actions">
                        <button className="btn-ghost btn-icon" onClick={() => openEdit(e)} title={t('expenses.edit')}>
                          <Pencil size={14} />
                        </button>
                        <button className="btn-danger btn-icon" onClick={() => setConfirmId(e.id)} title={t('expenses.delete')}>
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

        {!fetching && total > 0 && (
          <Pagination
            page={page} lastPage={lastPage} perPage={perPage} total={total}
            perPageOptions={PER_PAGE_OPTIONS}
            showingFrom={(page - 1) * perPage + 1}
            showingTo={Math.min(page * perPage, total)}
            onPage={setPage}
            onPerPage={n => { setPerPage(n); setPage(1); }}
            perPageLabel={t('groups.perPage')}
          />
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={ev => ev.target === ev.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-header-title">
                <div className="modal-header-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
                  <Receipt size={18} strokeWidth={2} />
                </div>
                <h3>{editId ? t('expenses.modalEditTitle') : t('expenses.modalTitle')}</h3>
              </div>
              <button className="btn-ghost btn-icon" onClick={closeModal}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>{t('expenses.nameLabel')}</label>
                  <div className="input-with-icon">
                    <span className="input-icon"><Tag size={14} /></span>
                    <input
                      placeholder={t('expenses.namePlaceholder')}
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('expenses.currencyLabel')}</label>
                    <div className="input-with-icon">
                      <span className="input-icon"><Coins size={14} /></span>
                      <select
                        value={form.currency_id}
                        onChange={e => setForm({ ...form, currency_id: +e.target.value })}
                        style={{ paddingLeft: 36 }}
                        required
                      >
                        {currencies.map(c => (
                          <option key={c.id} value={c.id}>{c.code} — {c.country}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>{t('expenses.valueLabel')}</label>
                    <input
                      type="number" min="0" step="0.01" placeholder="0.00"
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
                  {loading
                    ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />{t('expenses.saving')}</>
                    : editId ? t('expenses.saveChanges') : <><Plus size={14} />{t('expenses.createExpense')}</>
                  }
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
