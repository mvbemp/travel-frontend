import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  getCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency,
  type Currency,
  type CreateCurrencyDto,
} from '../api/currencies';
import ConfirmDialog from '../components/ConfirmDialog';

const emptyForm: CreateCurrencyDto = { code: '', symbol: '', country: '' };

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [form, setForm] = useState<CreateCurrencyDto>(emptyForm);
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
      const data = await getCurrencies();
      setCurrencies(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('currencies.failedLoad'));
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { load(); }, []);

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
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>💱</div>
          <div className="stat-info">
            <p>{t('currencies.total')}</p>
            <span>{currencies.length}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-header">
          <div>
            <h3>{t('currencies.tableTitle')} <span>({currencies.length})</span></h3>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            {t('currencies.newCurrency')}
          </button>
        </div>

        <div className="table-wrap">
          {fetching ? (
            <div className="empty-state"><span>{t('currencies.loading')}</span></div>
          ) : currencies.length === 0 ? (
            <div className="empty-state">
              <p>{t('currencies.noCurrencies')}</p>
              <span>{t('currencies.noCurrenciesHint')}</span>
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
                    <td data-label="#">{i + 1}</td>
                    <td data-label={t('currencies.colCode')}>
                      <span className="badge badge-blue">{c.code}</span>
                    </td>
                    <td data-label={t('currencies.colSymbol')} style={{ fontWeight: 600 }}>{c.symbol}</td>
                    <td data-label={t('currencies.colCountry')} style={{ color: 'var(--text-secondary)' }}>{c.country}</td>
                    <td data-label={t('currencies.colActions')}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-secondary btn-sm" onClick={() => openEdit(c)}>
                          {t('currencies.edit')}
                        </button>
                        <button className="btn-danger btn-sm" onClick={() => setConfirmId(c.id)}>
                          {t('currencies.delete')}
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
