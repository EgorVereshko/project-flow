
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { ApiError } from '@/services/api';
import { useAuthStore } from '@/features/auth/authStore';

import '../AuthPage.scss';

function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);

      const from = (
        location.state as { from?: string } | null
      )?.from;

      navigate(from?.startsWith('/') ? from : '/dashboard', {
        replace: true,
      });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Не удалось подключиться к серверу. Проверь, запущен ли backend.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-page__brand">
        <div className="auth-page__logo">
          <img className="auth-page__logo-image" src="/logo.png" alt="ProjectFlow logo" />
          <span>ProjectFlow</span>
        </div>

        <div className="auth-page__intro">
          <p className="auth-page__eyebrow">Работайте осознанно</p>
          <h1>От планов — к результатам.</h1>
          <p>
            Собирайте задачи в одном месте, управляйте приоритетами
            и двигайтесь к целям вместе с командой.
          </p>
        </div>

        <div className="auth-page__footer">
          Пространство для ваших идей и проектов.
        </div>
      </section>

      <section className="auth-page__main">
        <div className="auth-card">
          <header className="auth-card__heading">
            <h2>С возвращением!</h2>
            <p>Войдите в аккаунт, чтобы продолжить работу.</p>
          </header>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="login-email">Электронная почта</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                maxLength={255}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Пароль</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="Введите пароль"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {error && (
              <p className="auth-form__error" role="alert">
                {error}
              </p>
            )}

            <button
              className="auth-form__submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Входим...' : 'Войти в аккаунт'}
            </button>
          </form>

          <p className="auth-card__switch">
            Ещё нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;