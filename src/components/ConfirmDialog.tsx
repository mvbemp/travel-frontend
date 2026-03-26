import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal modal-sm">
        <div className="modal-header">
          <div className="modal-header-title">
            <div
              className="modal-header-icon"
              style={{
                background: danger ? 'var(--danger-light)' : 'var(--primary-light)',
                color: danger ? 'var(--danger)' : 'var(--primary)',
              }}
            >
              {danger
                ? <AlertTriangle size={18} strokeWidth={2} />
                : <CheckCircle size={18} strokeWidth={2} />
              }
            </div>
            <h3>{title}</h3>
          </div>
          <button className="btn-ghost btn-icon" onClick={onCancel}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body" style={{ paddingBottom: 12 }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onCancel}>{t('confirm.cancel')}</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>
            {confirmLabel ?? t('confirm.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
