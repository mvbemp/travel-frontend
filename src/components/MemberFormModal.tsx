import { useTranslation } from 'react-i18next';
import { X, User, CreditCard, Coins, DollarSign, Loader2, Globe, Calendar, MessageSquare } from 'lucide-react';
import type { AddMemberDto, UpdateMemberDto } from '../api/groups';
import type { Currency } from '../api/currencies';

function formatPassport(raw: string): string {
  const letters = raw.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 7);
  return letters + digits;
}

type MemberForm = {
  first_name: string;
  last_name: string;
  pax_type?: 'A' | 'C' | 'I';
  nationality?: string;
  passport?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female';
  date_of_expiry?: string;
  comment?: string;
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
            {/* First Name + Last Name */}
            <div className="form-row">
              <div className="form-group">
                <label>{t('member.firstName')}</label>
                <div className="input-with-icon">
                  <span className="input-icon"><User size={14} /></span>
                  <input
                    placeholder={t('member.firstNamePlaceholder')}
                    value={form.first_name}
                    onChange={e => set({ first_name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="form-group">
                <label>{t('member.lastName')}</label>
                <div className="input-with-icon">
                  <span className="input-icon"><User size={14} /></span>
                  <input
                    placeholder={t('member.lastNamePlaceholder')}
                    value={form.last_name}
                    onChange={e => set({ last_name: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Pax Type + Gender */}
            <div className="form-row">
              <div className="form-group">
                <label>{t('member.paxType')}</label>
                <select
                  value={form.pax_type ?? ''}
                  onChange={e => set({ pax_type: (e.target.value as MemberForm['pax_type']) || undefined })}
                >
                  <option value="">{t('member.paxTypeNone')}</option>
                  <option value="A">{t('member.paxA')}</option>
                  <option value="C">{t('member.paxC')}</option>
                  <option value="I">{t('member.paxI')}</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t('member.gender')}</label>
                <select
                  value={form.gender ?? ''}
                  onChange={e => set({ gender: (e.target.value as MemberForm['gender']) || undefined })}
                >
                  <option value="">{t('member.genderNone')}</option>
                  <option value="male">{t('member.genderMale')}</option>
                  <option value="female">{t('member.genderFemale')}</option>
                </select>
              </div>
            </div>

            {/* Nationality + Passport No */}
            <div className="form-row">
              <div className="form-group">
                <label>{t('member.nationality')}</label>
                <div className="input-with-icon">
                  <span className="input-icon"><Globe size={14} /></span>
                  <input
                    placeholder={t('member.nationalityPlaceholder')}
                    value={form.nationality ?? ''}
                    onChange={e => set({ nationality: e.target.value || undefined })}
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

            {/* Date of Birth + Date of Expiry */}
            <div className="form-row">
              <div className="form-group">
                <label>{t('member.dateOfBirth')}</label>
                <div className="input-with-icon">
                  <span className="input-icon"><Calendar size={14} /></span>
                  <input
                    type="date"
                    value={form.date_of_birth ?? ''}
                    onChange={e => set({ date_of_birth: e.target.value || undefined })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>{t('member.dateOfExpiry')}</label>
                <div className="input-with-icon">
                  <span className="input-icon"><Calendar size={14} /></span>
                  <input
                    type="date"
                    value={form.date_of_expiry ?? ''}
                    onChange={e => set({ date_of_expiry: e.target.value || undefined })}
                  />
                </div>
              </div>
            </div>

            {/* Currency + Payment */}
            <div className="form-row">
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

            {/* Comment */}
            <div className="form-group">
              <label>{t('member.comment')}</label>
              <div className="input-with-icon">
                <span className="input-icon" style={{ top: 10 }}><MessageSquare size={14} /></span>
                <textarea
                  placeholder={t('member.commentPlaceholder')}
                  value={form.comment ?? ''}
                  onChange={e => set({ comment: e.target.value || undefined })}
                  rows={2}
                  style={{ paddingLeft: 36, resize: 'vertical' }}
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
