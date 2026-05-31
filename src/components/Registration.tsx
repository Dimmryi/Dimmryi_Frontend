import React, { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageProvider';
import { useAuth } from '../services/useAuth';
import type { RootState } from '../store/store';

interface FormData {
  name: string;
  email: string;
  password: string;
}

type FormStatus = 'idle' | 'loading' | 'success' | 'duplicate_account' | 'forgot_loading' | 'forgot_sent' | 'error';

const copy = {
  uk: {
    loginHeroTitle: 'Знайдіть дім своєї мрії',
    loginHeroText: "Тисячі об'єктів нерухомості. Зручний пошук, детальні описи та актуальні ціни.",
    stats: ['Оголошень', 'Задоволених клієнтів', 'Підтримка'],
    registration: [
      'Форма для реєстрації',
      "Ім'я та прізвище",
      'Електронна пошта',
      'Пароль',
      "Бажаний спосіб зв'язку",
      '',
      '',
      '',
      '',
      '',
      '',
      'Зареєструватися',
      'Завантажується',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'Увійти',
      'Вже маєте аккаунт?',
      'Перейти до входу',
      'Листа надіслано!',
      'Перевірте поштову скриньку',
      'Посилання дійсне 30 хвилин.',
      'Повернутись до реєстрації',
      'Не вдалося завершити реєстрацію.',
      'Можливо, у вас вже є акаунт.',
      'Надсилаємо...',
      'Забули пароль?',
    ],
    errors: {
      allFieldsRequired: "Усі поля обов'язкові.",
      registrationFailed: 'Не вдалося зареєструватись. Спробуйте ще раз.',
      connectionError: "Помилка з'єднання. Спробуйте пізніше.",
      googleLoginFailed: 'Помилка входу через Google. Спробуйте ще раз.',
      googleAuthFailed: 'Помилка автентифікації Google.',
      successMessage: 'Реєстрацію завершено!',
    },
    or: 'або',
    noAccount: 'ще немає акаунту?',
    showPassword: 'Показати пароль',
    hidePassword: 'Приховати пароль',
  },
  en: {
    loginHeroTitle: 'Find Your Dream Home',
    loginHeroText: 'Thousands of properties. Easy search, detailed descriptions and current prices.',
    stats: ['Listings', 'Satisfied clients', 'Support'],
    registration: [
      'Registration form',
      'Full Name',
      'Email',
      'Password',
      'Preferred Contact',
      '',
      '',
      '',
      '',
      '',
      '',
      'Register',
      'Loading',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'Login',
      'Already have an account?',
      'Go to login',
      'The email was sent!',
      'Check your mailbox.',
      'The link is valid for 30 minutes.',
      'Back to registration',
      'Registration could not be completed.',
      'You may already have an account.',
      'Sending...',
      'Forgot your password?',
    ],
    errors: {
      allFieldsRequired: 'All fields are required.',
      registrationFailed: 'Failed to register. Please try again.',
      connectionError: 'Connection error. Please try again later.',
      googleLoginFailed: 'Google login failed. Please try again.',
      googleAuthFailed: 'Google authentication failed.',
      successMessage: 'Registration successful!',
    },
    or: 'or',
    noAccount: 'no account yet?',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
  },
};

const Registration: React.FC = () => {
  const { language } = useLanguage();
  const texts = copy[language === 'en' ? 'en' : 'uk'];
  const isRegistration = useSelector((state: RootState) => state.registration.isRegistered);
  const navigate = useNavigate();
  const location = useLocation();
  const { handleAuthSuccess, API_URL } = useAuth();
  const routeState = location.state as { notice?: string; from?: string } | null;

  const [formData, setFormData] = useState<FormData>({ name: '', email: '', password: '' });
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [duplicateEmail, setDuplicateEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isRegistration) navigate('/');
  }, [isRegistration, navigate]);

  const onAuthSuccess = (data: { user: { id: string; name: string; email: string }; message?: string }) => {
    setSuccessMessage(data.message || texts.errors.successMessage);
    setStatus('success');
    handleAuthSuccess(data, routeState?.from || '/');
  };

  const onDuplicateAccount = (email: string) => {
    setDuplicateEmail(email);
    setStatus('duplicate_account');
  };

  const handleForgotPassword = async () => {
    setStatus('forgot_loading');
    try {
      await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: duplicateEmail }),
        credentials: 'include',
      });
      setStatus('forgot_sent');
    } catch {
      setErrorMessage(texts.errors.connectionError);
      setStatus('error');
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    setStatus('loading');
    try {
      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
        credentials: 'include',
      });
      const data = await response.json();

      if (response.ok) {
        onAuthSuccess(data);
      } else if (response.status === 409) {
        onDuplicateAccount(data.email ?? formData.email);
      } else {
        setErrorMessage(data.message || texts.errors.googleAuthFailed);
        setStatus('error');
      }
    } catch {
      setErrorMessage(texts.errors.connectionError);
      setStatus('error');
    }
  };

  const handleGoogleError = () => {
    setErrorMessage(texts.errors.googleLoginFailed);
    setStatus('error');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setErrorMessage(texts.errors.allFieldsRequired);
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      const response = await fetch(`${API_URL}/api/usersBase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });
      const data = await response.json();

      if (response.ok) {
        setFormData({ name: '', email: '', password: '' });
        onAuthSuccess(data);
      } else if (response.status === 409) {
        onDuplicateAccount(data.email ?? formData.email);
      } else {
        setErrorMessage(data.message || texts.errors.registrationFailed);
        setStatus('error');
      }
    } catch {
      setErrorMessage(texts.errors.connectionError);
      setStatus('error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (status === 'error') {
      setStatus('idle');
      setErrorMessage('');
    }
  };

  const isLoading = status === 'loading' || status === 'forgot_loading';

  const renderBanner = () => {
    if (status === 'error') {
      return <div className="dm-reg__banner dm-reg__banner--error">{errorMessage}</div>;
    }

    if (status === 'success') {
      return <div className="dm-reg__banner dm-reg__banner--success">{successMessage}</div>;
    }

    return null;
  };

  const renderDuplicateBlock = () => (
    <div className="dm-reg__state">
      <div className="dm-reg__state-icon dm-reg__state-icon--warning">!</div>
      <h2>{texts.registration[30]}</h2>
      <p>{texts.registration[31]}</p>
      <div className="dm-reg__split-actions">
        <Link to="/login" state={{ prefilledEmail: duplicateEmail }} className="dm-reg__button dm-reg__button--primary">
          {texts.registration[23]}
        </Link>
        <button className="dm-reg__button dm-reg__button--secondary" onClick={handleForgotPassword} disabled={isLoading}>
          {status === 'forgot_loading' ? texts.registration[32] : texts.registration[33]}
        </button>
      </div>
      <button
        className="dm-reg__link-button"
        onClick={() => {
          setStatus('idle');
          setErrorMessage('');
          setDuplicateEmail('');
        }}
      >
        {texts.registration[29]}
      </button>
    </div>
  );

  const renderForgotSentBlock = () => (
    <div className="dm-reg__state">
      <div className="dm-reg__state-icon">M</div>
      <h2>{texts.registration[26]}</h2>
      <p>
        {texts.registration[27]} <strong>{duplicateEmail}</strong>. {texts.registration[28]}
      </p>
      <Link to="/login" state={{ prefilledEmail: duplicateEmail }} className="dm-reg__button dm-reg__button--primary">
        {texts.registration[25]}
      </Link>
    </div>
  );

  return (
    <main className="dm-reg">
      <section className="dm-reg__hero" aria-label="Registration introduction">
        <div className="dm-reg__brand">
          <div className="dm-reg__brand-icon" aria-hidden>
            <svg viewBox="0 -960 960 960" width="22" height="22" fill="currentColor">
              <path d="M160-120v-480l320-240 320 240v480H560v-280H400v280H160Z" />
            </svg>
          </div>
          <span>My Dream House</span>
        </div>
        <div className="dm-reg__hero-copy">
          <h1>{texts.loginHeroTitle}</h1>
          <p>{texts.loginHeroText}</p>
        </div>
        <div className="dm-reg__stats">
          <div>
            <strong>1 200+</strong>
            <span>{texts.stats[0]}</span>
          </div>
          <div>
            <strong>98%</strong>
            <span>{texts.stats[1]}</span>
          </div>
          <div>
            <strong>24/7</strong>
            <span>{texts.stats[2]}</span>
          </div>
        </div>
      </section>

      <section className="dm-reg__panel" aria-label={texts.registration[0]}>
        <div className="dm-reg__card">
          <div className="dm-reg__mobile-brand">
            <div className="dm-reg__brand-icon" aria-hidden>
              <svg viewBox="0 -960 960 960" width="20" height="20" fill="currentColor">
                <path d="M160-120v-480l320-240 320 240v480H560v-280H400v280H160Z" />
              </svg>
            </div>
            <span>My Dream House</span>
          </div>

          <h1>{texts.registration[0]}</h1>
          <p className="dm-reg__subtitle">
            {texts.registration[11]} - {texts.registration[4]}
          </p>

          {routeState?.notice && status === 'idle' && (
            <div className="dm-reg__banner dm-reg__banner--info">{routeState.notice}</div>
          )}
          {renderBanner()}
          {status === 'duplicate_account' && renderDuplicateBlock()}
          {status === 'forgot_sent' && renderForgotSentBlock()}

          {(status === 'idle' || status === 'error' || status === 'loading') && (
            <>
              <form className="dm-reg__form" onSubmit={handleSubmit} noValidate>
                <label>
                  <span>{texts.registration[1]}</span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={texts.registration[1]}
                    required
                    disabled={isLoading}
                    autoComplete="name"
                  />
                </label>
                <label>
                  <span>{texts.registration[2]}</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </label>
                <label>
                  <span>{texts.registration[3]}</span>
                  <div className="dm-reg__password">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="********"
                      required
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? texts.hidePassword : texts.showPassword}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </label>
                <button className="dm-reg__button dm-reg__button--primary" type="submit" disabled={isLoading}>
                  {isLoading ? `${texts.registration[12]}...` : texts.registration[11]}
                </button>
              </form>

              <div className="dm-reg__divider">
                <span>{texts.or}</span>
              </div>

              <div className="dm-reg__google">
                <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
              </div>

              <div className="dm-reg__divider">
                <span>{texts.noAccount}</span>
              </div>

              <p className="dm-reg__login">
                {texts.registration[24]} <Link to="/login">{texts.registration[23]}</Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default Registration;
