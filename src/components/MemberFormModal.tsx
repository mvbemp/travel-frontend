import { useTranslation } from 'react-i18next';
import type { AddMemberDto, UpdateMemberDto } from '../api/groups';
import type { Currency } from '../api/currencies';

function formatPassport(raw: string): string {
  const letters = raw.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 7);
  return letters + digits;
}

type MemberForm = {
  name: string;
  passport?: string;
  passport_type?: 'green_passport' | 'red_passport' | 'id_card';
  currency_id?: number;
  payment?: number;
};

interface MemberFormModalProps {
  title: string;
  form: MemberForm;
  currencies: Currency[];
  loading: boolean;
  submitLabel: string;
  onSubmit: (e: { preventDefault(): void }) => void;
  onChange: (form: MemberForm) => void;
  onClose: () => void;
}

export type { MemberForm };

export default function MemberFormModal({
  title,
  form,
  currencies,
  loading,
  submitLabel,
  onSubmit,
  onChange,
  onClose,
}: MemberFormModalProps) {
  const { t } = useTranslation();
  const set = (patch: Partial<MemberForm>) => onChange({ ...form, ...patch });

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>{t('member.fullName')}</label>
                <input
                  placeholder={t('member.fullNamePlaceholder')}
                  value={form.name}
                  onChange={e => set({ name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>{t('member.passportNo')}</label>
                <input
                  placeholder={t('member.passportPlaceholder')}
                  value={form.passport ?? ''}
                  onChange={e => set({ passport: formatPassport(e.target.value) })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('member.passportType')}</label>
                <select
                  value={form.passport_type ?? ''}
                  onChange={e => set({ passport_type: (e.target.value as AddMemberDto['passport_type']) || undefined })}
                >
                  <option value="">{t('member.passportNone')}</option>
                  <option value="green_passport">{t('member.passportGreen')}</option>
                  <option value="red_passport">{t('member.passportRed')}</option>
                  <option value="id_card">{t('member.passportId')}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t('member.currency')}</label>
                <select
                  value={form.currency_id ?? ''}
                  onChange={e => set({ currency_id: e.target.value ? +e.target.value : undefined })}
                >
                  <option value="">{t('member.currencyDefault')}</option>
                  {currencies.map(c => (
                    <option key={c.id} value={c.id}>{c.code} — {c.symbol}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>{t('member.payment')}</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={form.payment ?? ''}
                onChange={e => set({ payment: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>{t('member.cancel')}</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? t('member.saving') : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export type { AddMemberDto, UpdateMemberDto };
