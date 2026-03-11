import type { AddMemberDto, UpdateMemberDto } from '../api/groups';

function formatPassport(raw: string): string {
  const letters = raw.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 7);
  return letters + digits;
}

type MemberForm = {
  name: string;
  passport?: string;
  passport_type?: 'green_passport' | 'red_passport' | 'id_card';
  payment?: number;
};

interface MemberFormModalProps {
  title: string;
  form: MemberForm;
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
  loading,
  submitLabel,
  onSubmit,
  onChange,
  onClose,
}: MemberFormModalProps) {
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
                <label>Full Name *</label>
                <input
                  placeholder="Ali Karimov"
                  value={form.name}
                  onChange={e => set({ name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Passport No.</label>
                <input
                  placeholder="AA1234567"
                  value={form.passport ?? ''}
                  onChange={e => set({ passport: formatPassport(e.target.value) })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Passport Type</label>
                <select
                  value={form.passport_type ?? ''}
                  onChange={e => set({ passport_type: (e.target.value as AddMemberDto['passport_type']) || undefined })}
                >
                  <option value="">— None —</option>
                  <option value="green_passport">Green Passport</option>
                  <option value="red_passport">Red Passport</option>
                  <option value="id_card">ID Card</option>
                </select>
              </div>
              <div className="form-group">
                <label>Payment ($)</label>
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
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving…' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export type { AddMemberDto, UpdateMemberDto };
