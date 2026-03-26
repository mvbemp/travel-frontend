import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { UserCircle, Mail, Lock, Loader2, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api/auth';

export default function ProfilePage() {
  const { user, setToken } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirm) {
      toast.error(t('profile.passwordMismatch'));
      return;
    }
    const payload: { email?: string; password?: string } = {};
    if (email && email !== user?.email) payload.email = email;
    if (password) payload.password = password;
    if (!Object.keys(payload).length) {
      toast.info(t('profile.noChanges'));
      return;
    }
    setLoading(true);
    try {
      await updateProfile(payload);
      toast.success(t('profile.updated'));
      setPassword('');
      setConfirm('');
      // If email changed, re-fetch token or just update local user display
      if (payload.email) {
        // Force a fresh getMe by re-setting token to trigger AuthContext refresh
        const token = localStorage.getItem('token');
        if (token) setToken(token);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('profile.failedUpdate'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-title">
        <h2>{t('profile.pageTitle')}</h2>
        <p>{t('profile.pageSubtitle')}</p>
      </div>

      <div className="card" style={{ maxWidth: 520 }}>
        <div className="modal-header" style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <div className="modal-header-title">
            <div className="modal-header-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              <UserCircle size={18} strokeWidth={2} />
            </div>
            <h3>{t('profile.cardTitle')}</h3>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>{t('profile.emailLabel')}</label>
              <div className="input-with-icon">
                <span className="input-icon"><Mail size={14} /></span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label>{t('profile.newPasswordLabel')}</label>
              <div className="input-with-icon">
                <span className="input-icon"><Lock size={14} /></span>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('profile.newPasswordPlaceholder')}
                  minLength={5}
                />
              </div>
            </div>

            <div className="form-group">
              <label>{t('profile.confirmPasswordLabel')}</label>
              <div className="input-with-icon">
                <span className="input-icon"><Lock size={14} /></span>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder={t('profile.confirmPasswordPlaceholder')}
                  minLength={5}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? <><Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />{t('profile.saving')}</>
                : <><Save size={14} />{t('profile.save')}</>
              }
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
