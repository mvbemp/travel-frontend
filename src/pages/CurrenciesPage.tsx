import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  DollarSign, Plus, Search, Pencil, Trash2, X, Star, Loader2, Globe,
} from 'lucide-react';
import {
  getCurrenciesPaginated, getCommonCurrencies,
  createCurrency, updateCurrency, deleteCurrency,
  type Currency, type CreateCurrencyDto,
} from '../api/currencies';
import ConfirmDialog from '../components/ConfirmDialog';
import { Pagination } from './UsersPage';

const emptyForm: CreateCurrencyDto = { code: '', symbol: '', country: '', is_main: false, currency_change: 1 };
const emptyRate = { from: 1, to: 1 };
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
  const [rate, setRate] = useState(emptyRate);
  const [editId, setEditId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [mainCurrency, setMainCurrency] = useState<Currency | null>(null);
  const { t } = useTranslation();

  const closeModal = () => { setShowModal(false); setForm(emptyForm); setRate(emptyRate); setEditId(null); };

  const loadMainCurrency = async () => {
    try {
      const all = await getCommonCurrencies();
      setMainCurrency(all.find(c => c.is_main) ?? null);
    } catch { /* silent */ }
  };

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

  useEffect(() => { loadMainCurrency(); }, []);
  useEffect(() => { load(page, perPage, search); }, [page, perPage]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); load(1, perPage, value); }, 400);
  };

  const openEdit = (c: Currency) => {
    setForm({ code: c.code, symbol: c.symbol, country: c.country, is_main: c.is_main, currency_change: parseFloat(c.currency_change) });
    setRate({ from: 1, to: parseFloat(c.currency_change) || 1 });
    setEditId(c.id);
    setShowModal(true);
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    const currency_change = form.is_main ? 1 : parseFloat((rate.to / rate.from).toFixed(5));
    const payload = { ...form, currency_change };
    try {
      if (editId !== null) {
        await updateCurrency(editId, payload);
        toast.success(t('currencies.updated'));
      } else {
        await createCurrency(payload);
        toast.success(t('currencies.created'));
      }
      closeModal();
      await Promise.all([load(), loadMainCurrency()]);
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
        <div className="stat-card" style={{ '--stat-accent': 'var(--success)' } as React.CSSProperties}>
          <div className="stat-card-head">
            <p className="stat-label">{t('currencies.total')}</p>
            <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
              <DollarSign size={20} strokeWidth={2} />
            </div>
          </div>
          <span className="stat-value">{total}</span>
        </div>
      </div>

      <div className="card">
        <div className="table-header">
          <div className="table-header-left">
            <h3>{t('currencies.tableTitle')}</h3>
            <span className="table-header-sub">{total} {t('currencies.total').toLowerCase()}</span>
          </div>
          <div className="table-header-actions">
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={15} />{t('currencies.newCurrency')}
            </button>
          </div>
        </div>

        <div className="search-bar">
          <div className="input-with-icon search-input">
            <span className="input-icon"><Search size={14} /></span>
            <input
              placeholder={t('currencies.searchPlaceholder')}
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
              <span>{t('currencies.loading')}</span>
            </div>
          ) : currencies.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><DollarSign size={22} /></div>
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
                  <th>{t('currencies.colRate')}</th>
                  <th>{t('currencies.colMain')}</th>
                  <th>{t('currencies.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {currencies.map((c, i) => (
                  <tr key={c.id}>
                    <td data-label="#" style={{ color: 'var(--text-muted)', fontSize: 12 }}>{(page - 1) * perPage + i + 1}</td>
                    <td data-label={t('currencies.colCode')}>
                      <span className="badge badge-blue">{c.code}</span>
                    </td>
                    <td data-label={t('currencies.colSymbol')}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{c.symbol}</span>
                    </td>
                    <td data-label={t('currencies.colCountry')}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                        <Globe size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        {c.country}
                      </span>
                    </td>
                    <td data-label={t('currencies.colRate')}>
                      {c.is_main
                        ? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 12 }}>—</span>
                        : <span style={{ fontWeight: 600, fontSize: 13 }}>
                            1 {mainCurrency?.code ?? '?'} = {parseFloat(c.currency_change).toLocaleString()} {c.code}
                          </span>
                      }
                    </td>
                    <td data-label={t('currencies.colMain')}>
                      {c.is_main && (
                        <span className="badge badge-green">
                          <Star size={10} fill="currentColor" />{t('currencies.mainBadge')}
                        </span>
                      )}
                    </td>
                    <td data-label={t('currencies.colActions')}>
                      <div className="table-actions">
                        <button className="btn-ghost btn-icon" onClick={() => openEdit(c)} title={t('currencies.edit')}>
                          <Pencil size={14} />
                        </button>
                        <button className="btn-danger btn-icon" onClick={() => setConfirmId(c.id)} title={t('currencies.delete')}>
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
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-header-title">
                <div className="modal-header-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                  <DollarSign size={18} strokeWidth={2} />
                </div>
                <h3>{editId ? t('currencies.modalEditTitle') : t('currencies.modalTitle')}</h3>
              </div>
              <button className="btn-ghost btn-icon" onClick={closeModal}><X size={16} /></button>
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
                  <div className="input-with-icon">
                    <span className="input-icon"><Globe size={14} /></span>
                    <input
                      placeholder={t('currencies.countryPlaceholder')}
                      value={form.country}
                      onChange={e => setForm({ ...form, country: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Rate */}
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ marginBottom: 0 }}>{t('currencies.rateLabel')}</label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 400, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <input
                        type="checkbox"
                        style={{ width: 14, height: 14 }}
                        checked={!!form.is_main}
                        onChange={e => {
                          setForm({ ...form, is_main: e.target.checked });
                          if (e.target.checked) setRate({ from: 1, to: 1 });
                        }}
                      />
                      <Star size={12} />
                      {t('currencies.isMainCheck')}
                    </label>
                  </div>
                  <div className="rate-row">
                    <div className="rate-col">
                      <input
                        type="number" min="0.00001" step="any"
                        value={rate.from}
                        disabled={!!form.is_main}
                        onChange={e => setRate(r => ({ ...r, from: parseFloat(e.target.value) || 1 }))}
                        style={{ flex: 1 }}
                      />
                      <span className="rate-code">{mainCurrency?.code ?? t('currencies.mainCurrencyCode')}</span>
                    </div>
                    <span className="rate-row-eq">=</span>
                    <div className="rate-col">
                      <input
                        type="number" min="0.00001" step="any"
                        value={rate.to}
                        disabled={!!form.is_main}
                        onChange={e => setRate(r => ({ ...r, to: parseFloat(e.target.value) || 1 }))}
                        style={{ flex: 1 }}
                      />
                      <span className="rate-code">{form.code || t('currencies.thisCurrencyCode')}</span>
                    </div>
                  </div>
                  {!form.is_main && rate.from > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                      {t('currencies.rateResult', { rate: (rate.to / rate.from).toFixed(5), code: form.code || '?' })}
                    </span>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>{t('currencies.cancel')}</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading
                    ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />{t('currencies.saving')}</>
                    : editId ? t('currencies.saveChanges') : <><Plus size={14} />{t('currencies.createCurrency')}</>
                  }
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
