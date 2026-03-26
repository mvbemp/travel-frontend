import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Plane, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { login } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 6;
  const isFormValid = emailValid && passwordValid;

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      setToken(data.access_token);
      navigate('/users');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('login.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-glow" />
      <div className="login-glow-2" />

      <div className="login-card">
        {/* Header */}
        <div className="login-card-header">
          <div className="login-card-logo">
            <Plane size={28} strokeWidth={2} />
          </div>
          <h1>{t('login.title')}</h1>
          <p>{t('login.subtitle')}</p>
        </div>

        {/* Form */}
        <form className="login-card-body" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="form-group">
            <label>{t('login.emailLabel')}</label>
            <div className="input-with-icon">
              <span className="input-icon"><Mail size={15} /></span>
              <input
                type="email"
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => setTouched(p => ({ ...p, email: true }))}
                autoFocus
                autoComplete="email"
              />
            </div>
            {touched.email && !emailValid && (
              <span className="field-error">{t('login.emailError')}</span>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label>{t('login.passwordLabel')}</label>
            <div className="input-with-icon">
              <span className="input-icon"><Lock size={15} /></span>
              <input
                type="password"
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={() => setTouched(p => ({ ...p, password: true }))}
                autoComplete="current-password"
              />
            </div>
            {touched.password && !passwordValid && (
              <span className="field-error">{t('login.passwordError')}</span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary login-submit"
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin-icon" />
                {t('login.signingIn')}
              </>
            ) : (
              <>
                {t('login.signIn')}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>

      <style>{`
        .spin-icon { animation: spin 0.7s linear infinite; }
      `}</style>
    </div>
  );
}
