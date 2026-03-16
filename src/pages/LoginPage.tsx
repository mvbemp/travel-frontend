import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
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
      setToken(data.access_token ?? data.token ?? data.message);
      navigate('/users');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('login.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card-header">
          <div className="login-card-logo">✈️</div>
          <h1>{t('login.title')}</h1>
          <p>{t('login.subtitle')}</p>
        </div>
        <form className="login-card-body" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('login.emailLabel')}</label>
            <input
              type="email"
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, email: true }))}
              autoFocus
            />
            {touched.email && !emailValid && (
              <span className="field-error">{t('login.emailError')}</span>
            )}
          </div>
          <div className="form-group">
            <label>{t('login.passwordLabel')}</label>
            <input
              type="password"
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
            />
            {touched.password && !passwordValid && (
              <span className="field-error">{t('login.passwordError')}</span>
            )}
          </div>
          <button type="submit" className="btn-primary login-submit" disabled={loading || !isFormValid}>
            {loading ? t('login.signingIn') : t('login.signIn')}
          </button>
        </form>
      </div>
    </div>
  );
}
