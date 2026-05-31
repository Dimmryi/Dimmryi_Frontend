import React, { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../services/useAuth';
import { useLanguage } from '../LanguageProvider';
import type { RootState } from '../store/store';

type LoginStatus = 'idle' | 'loading' | 'success' | 'wrong_credentials' | 'wrong_method' | 'error';

const copy = {
  uk: {
    title: 'Увійти',
    subtitle: 'Введіть дані для входу в обліковий запис',
    email: 'Електронна пошта',
    password: 'Пароль',
    submit: 'Увійти',
    loading: 'Завантаження...',
    success: 'Вхід успішний! Перенаправляємо...',
    forgot: 'Забули пароль?',
    or: 'або',
    noAccount: 'ще немає акаунту?',
    register: 'Зареєструватись',
    home: 'На головну',
    heroTitle: 'Знайдіть дім своєї мрії',
    heroText: "Тисячі об'єктів нерухомості. Зручний пошук, детальні описи та актуальні ціни.",
    stats: ['Оголошень', 'Задоволених клієнтів', 'Підтримка'],
    errors: {
      wrongPassword: 'Невірний email або пароль.',
      loginFailed: 'Помилка входу. Спробуйте ще раз.',
      connectionError: "Помилка з'єднання. Спробуйте пізніше.",
      googleEmailWithPassword: 'Цей email зареєстровано з паролем. Увійдіть через форму вище.',
      googleEmailWithGoogle: 'Цей email зареєстровано через Google. Скористайтесь кнопкою входу нижче.',
      googleEmailWithMethod: 'Цей email зареєстровано через',
      googleLoginFailed: 'Помилка входу через Google. Спробуйте ще раз.',
      googleAuthFailed: 'Помилка автентифікації Google.',
    },
  },
  en: {
    title: 'Sign in',
    subtitle: 'Enter your account details',
    email: 'Email',
    password: 'Password',
    submit: 'Sign in',
    loading: 'Loading...',
    success: 'Login successful! Redirecting...',
    forgot: 'Forgot password?',
    or: 'or',
    noAccount: 'no account yet?',
    register: 'Register',
    home: 'Go to Home',
    heroTitle: 'Find Your Dream Home',
    heroText: 'Thousands of properties. Easy search, detailed descriptions and current prices.',
    stats: ['Listings', 'Satisfied clients', 'Support'],
    errors: {
      wrongPassword: 'Invalid email or password.',
      loginFailed: 'Login error. Please try again.',
      connectionError: 'Connection error. Please try again later.',
      googleEmailWithPassword: 'This email is registered with a password. Please sign in using the form above.',
      googleEmailWithGoogle: 'This email is registered via Google. Please use the button below to sign in.',
      googleEmailWithMethod: 'This email is registered via',
      googleLoginFailed: 'Google login failed. Please try again.',
      googleAuthFailed: 'Google authentication failed.',
    },
  },
};

const Login: React.FC = () => {
  const { language } = useLanguage();
  const texts = copy[language === 'en' ? 'en' : 'uk'];
  const isRegistration = useSelector((state: RootState) => state.registration.isRegistered);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isLogin);
  const navigate = useNavigate();
  const location = useLocation();
  const { handleAuthSuccess, API_URL } = useAuth();
  const routeState = location.state as { notice?: string; from?: string; prefilledEmail?: string; suggestedMethod?: string } | null;

  const [email, setEmail] = useState<string>(routeState?.prefilledEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<LoginStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (routeState?.suggestedMethod === 'google') {
      setErrorMessage(texts.errors.googleEmailWithGoogle);
      setStatus('wrong_method');
    }
  }, [routeState?.suggestedMethod, texts.errors.googleEmailWithGoogle]);

  useEffect(() => {
    if (isRegistration && isAuthenticated) {
      navigate(routeState?.from || '/', { replace: true });
    }
  }, [isRegistration, isAuthenticated, routeState?.from, navigate]);

  const resetForm = () => {
    if (status !== 'idle') {
      setStatus('idle');
      setErrorMessage('');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, authMethod: 'password' }),
        credentials: 'include',
      });
      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        handleAuthSuccess(data);
      } else if (response.status === 409) {
        setErrorMessage(
          data.authMethod === 'google'
            ? texts.errors.googleEmailWithGoogle
            : `${texts.errors.googleEmailWithMethod} ${data.authMethod}.`,
        );
        setStatus('wrong_method');
      } else if (response.status === 401) {
        setErrorMessage(texts.errors.wrongPassword);
        setStatus('wrong_credentials');
      } else {
        setErrorMessage(data.message || texts.errors.loginFailed);
        setStatus('error');
      }
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
        setStatus('success');
        handleAuthSuccess(data);
      } else if (response.status === 409) {
        setErrorMessage(texts.errors.googleEmailWithPassword);
        setStatus('wrong_method');
      } else {
        setErrorMessage(data.message || texts.errors.googleAuthFailed);
        setStatus('error');
      }
    } catch {
      setErrorMessage(texts.errors.connectionError);
      setStatus('error');
    }
  };

  const isLoading = status === 'loading';
  const hasError = status === 'error' || status === 'wrong_credentials' || status === 'wrong_method';

  return (
    <main className="dm-login">
      <section className="dm-login__hero" aria-label="Login introduction">
        <div className="dm-reg__brand">
          <div className="dm-reg__brand-icon" aria-hidden>
            <svg viewBox="0 -960 960 960" width="22" height="22" fill="currentColor">
              <path d="M160-120v-480l320-240 320 240v480H560v-280H400v280H160Z" />
            </svg>
          </div>
          <span>My Dream House</span>
        </div>
        <div className="dm-reg__hero-copy">
          <h1>{texts.heroTitle}</h1>
          <p>{texts.heroText}</p>
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

      <section className="dm-reg__panel" aria-label={texts.title}>
        <div className="dm-reg__card">
          <h1>{texts.title}</h1>
          <p className="dm-reg__subtitle">{texts.subtitle}</p>

          {routeState?.notice && status === 'idle' && (
            <div className="dm-reg__banner dm-reg__banner--info">{routeState.notice}</div>
          )}
          {hasError && <div className="dm-reg__banner dm-reg__banner--error">{errorMessage}</div>}
          {status === 'success' && <div className="dm-reg__banner dm-reg__banner--success">{texts.success}</div>}

          {status !== 'success' && (
            <>
              <form className="dm-reg__form" onSubmit={handleLogin} noValidate>
                <label>
                  <span>{texts.email}</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      resetForm();
                    }}
                    placeholder="name@example.com"
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </label>
                <label>
                  <span>{texts.password}</span>
                  <div className="dm-reg__password">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        resetForm();
                      }}
                      placeholder="********"
                      required
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                    <button type="button" onClick={() => setShowPassword((value) => !value)}>
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </label>
                <button className="dm-reg__button dm-reg__button--primary" type="submit" disabled={isLoading}>
                  {isLoading ? texts.loading : texts.submit}
                </button>
              </form>

              {status === 'wrong_credentials' && (
                <div className="dm-login__forgot">
                  <button onClick={() => navigate('/forgot-password', { state: { prefilledEmail: email } })}>
                    {texts.forgot}
                  </button>
                </div>
              )}

              <div className="dm-reg__divider">
                <span>{texts.or}</span>
              </div>

              <div className="dm-reg__google">
                <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => {
                  setErrorMessage(texts.errors.googleLoginFailed);
                  setStatus('error');
                }} />
              </div>

              <div className="dm-reg__divider">
                <span>{texts.noAccount}</span>
              </div>

              <p className="dm-reg__login">
                <Link to="/registration">{texts.register}</Link>
              </p>
            </>
          )}

          {status === 'success' && (
            <button className="dm-reg__button dm-reg__button--primary dm-login__home" onClick={() => navigate('/')}>
              {texts.home}
            </button>
          )}
        </div>
      </section>
    </main>
  );
};

export default Login;
