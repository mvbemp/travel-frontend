import { useTranslation } from 'react-i18next';
import { X, User, CreditCard, BookOpen, Coins, DollarSign, Loader2 } from 'lucide-react';
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
          <div className="modal-header-title">
            <div className="modal-header-icon" style={{ background: 'var(--purple-light)', color: 'var(--purple)' }}>
              <User size={18} strokeWidth={2} />
            </div>
            <h3>{title}</h3>
          </div>
          <button className="btn-ghost btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="modal-body">
            {/* Name + Passport No */}
            <div className="form-row">
              <div className="form-group">
                <label>{t('member.fullName')}</label>
                <div className="input-with-icon">
                  <span className="input-icon"><User size={14} /></span>
                  <input
                    placeholder={t('member.fullNamePlaceholder')}
                    value={form.name}
                    onChange={e => set({ name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="form-group">
                <label>{t('member.passportNo')}</label>
                <div className="input-with-icon">
                  <span className="input-icon"><CreditCard size={14} /></span>
                  <input
                    placeholder={t('member.passportPlaceholder')}
                    value={form.passport ?? ''}
                    onChange={e => set({ passport: formatPassport(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Passport Type + Currency */}
            <div className="form-row">
              <div className="form-group">
                <label>{t('member.passportType')}</label>
                <div className="input-with-icon">
                  <span className="input-icon"><BookOpen size={14} /></span>
                  <select
                    value={form.passport_type ?? ''}
                    onChange={e => set({ passport_type: (e.target.value as AddMemberDto['passport_type']) || undefined })}
                    style={{ paddingLeft: 36 }}
                  >
                    <option value="">{t('member.passportNone')}</option>
                    <option value="green_passport">{t('member.passportGreen')}</option>
                    <option value="red_passport">{t('member.passportRed')}</option>
                    <option value="id_card">{t('member.passportId')}</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>{t('member.currency')}</label>
                <div className="input-with-icon">
                  <span className="input-icon"><Coins size={14} /></span>
                  <select
                    value={form.currency_id ?? ''}
                    onChange={e => set({ currency_id: e.target.value ? +e.target.value : undefined })}
                    style={{ paddingLeft: 36 }}
                  >
                    <option value="">{t('member.currency')}</option>
                    {currencies.map(c => (
                      <option key={c.id} value={c.id}>{c.code} — {c.symbol}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="form-group">
              <label>{t('member.payment')}</label>
              <div className="input-with-icon">
                <span className="input-icon"><DollarSign size={14} /></span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.payment ?? ''}
                  onChange={e => set({ payment: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              {t('member.cancel')}
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />{t('member.saving')}</>
              ) : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export type { AddMemberDto, UpdateMemberDto };
