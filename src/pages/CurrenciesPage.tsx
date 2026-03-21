import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  getCurrenciesPaginated,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  type Currency,
  type CreateCurrencyDto,
} from '../api/currencies';
import ConfirmDialog from '../components/ConfirmDialog';

const emptyForm: CreateCurrencyDto = { code: '', symbol: '', country: '' };
const PER_PAGE_OPTIONS = [10, 20, 50];

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [form, setForm] = useState<CreateCurrencyDto>(emptyForm);
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
      const res = await getCurrenciesPaginated(p, pp, s);
      setCurrencies(Array.isArray(res.data) ? res.data : []);
      setTotal(res.total ?? 0);
      setPage(res.page ?? p);
      setLastPage(res.lastPage ?? 1);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('currencies.failedLoad'));
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

  const openEdit = (c: Currency) => {
    setForm({ code: c.code, symbol: c.symbol, country: c.country });
    setEditId(c.id);
    setShowModal(true);
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId !== null) {
        await updateCurrency(editId, form);
        toast.success(t('currencies.updated'));
      } else {
        await createCurrency(form);
        toast.success(t('currencies.created'));
      }
      closeModal();
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : editId ? t('currencies.failedUpdate') : t('currencies.failedCreate'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCurrency(id);
      setCurrencies(prev => prev.filter(c => c.id !== id));
      toast.success(t('currencies.deleted'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('currencies.failedDelete'));
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <>
      <div className="page-title">
        <h2>{t('currencies.pageTitle')}</h2>
        <p>{t('currencies.pageSubtitle')}</p>
      </div>

      <div className="stats-bar">
        <div className="stat-card" style={{ '--stat-accent': '#2563eb' } as React.CSSProperties}>
          <div className="stat-card-head">
            <p className="stat-label">{t('currencies.total')}</p>
            <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <span className="stat-value">{total}</span>
        </div>
      </div>

      <div className="card">
        <div className="table-header">
          <div><h3>{t('currencies.tableTitle')} <span>({total})</span></h3></div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            {t('currencies.newCurrency')}
          </button>
        </div>

        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
          <input
            style={{ maxWidth: 360, height: 36 }}
            placeholder={t('currencies.searchPlaceholder')}
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          {fetching ? (
            <div className="empty-state"><span>{t('currencies.loading')}</span></div>
          ) : currencies.length === 0 ? (
            <div className="empty-state">
              <p>{search ? t('currencies.noResults') : t('currencies.noCurrencies')}</p>
              <span>{search ? t('currencies.noResultsHint') : t('currencies.noCurrenciesHint')}</span>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('currencies.colCode')}</th>
                  <th>{t('currencies.colSymbol')}</th>
                  <th>{t('currencies.colCountry')}</th>
                  <th>{t('currencies.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {currencies.map((c, i) => (
                  <tr key={c.id}>
                    <td data-label="#">{(page - 1) * perPage + i + 1}</td>
                    <td data-label={t('currencies.colCode')}>
                      <span className="badge badge-blue">{c.code}</span>
                    </td>
                    <td data-label={t('currencies.colSymbol')} style={{ fontWeight: 600 }}>{c.symbol}</td>
                    <td data-label={t('currencies.colCountry')} style={{ color: 'var(--text-secondary)' }}>{c.country}</td>
                    <td data-label={t('currencies.colActions')}>
                      <div className="table-actions">
                        <button className="btn-secondary btn-sm" onClick={() => openEdit(c)}>{t('currencies.edit')}</button>
                        <button className="btn-danger btn-sm" onClick={() => setConfirmId(c.id)}>{t('currencies.delete')}</button>
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
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editId ? t('currencies.modalEditTitle') : t('currencies.modalTitle')}</h3>
              <button className="btn-ghost btn-icon" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('currencies.codeLabel')}</label>
                    <input
                      placeholder={t('currencies.codePlaceholder')}
                      value={form.code}
                      onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('currencies.symbolLabel')}</label>
                    <input
                      placeholder={t('currencies.symbolPlaceholder')}
                      value={form.symbol}
                      onChange={e => setForm({ ...form, symbol: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>{t('currencies.countryLabel')}</label>
                  <input
                    placeholder={t('currencies.countryPlaceholder')}
                    value={form.country}
                    onChange={e => setForm({ ...form, country: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>{t('currencies.cancel')}</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? t('currencies.saving') : editId ? t('currencies.saveChanges') : t('currencies.createCurrency')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmId !== null && (
        <ConfirmDialog
          title={t('currencies.confirmDeleteTitle')}
          message={t('currencies.confirmDeleteMessage')}
          confirmLabel={t('currencies.delete')}
          danger
          onConfirm={() => handleDelete(confirmId!)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </>
  );
}
