
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ApiError } from '@/services/api';
import { useAuthStore } from '@/features/auth/authStore';
import { registerSchema } from '@/features/auth/registerSchema';

import '../AuthPage.scss';

function RegisterPage() {
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const validation = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Проверьте введённые данные.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register(
        validation.data.name,
        validation.data.email,
        validation.data.password,
      );
      navigate('/dashboard', { replace: true });
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
          <p className="auth-page__eyebrow">Ваш следующий шаг</p>
          <h1>Создайте пространство для больших идей.</h1>
          <p>
            Организуйте проекты, разбивайте цели на задачи
            и наблюдайте, как работа превращается в результат.
          </p>
        </div>

        <div className="auth-page__footer">
          Начните с малого. Двигайтесь вперёд.
        </div>
      </section>

      <section className="auth-page__main">
        <div className="auth-card">
          <header className="auth-card__heading">
            <h2>Создать аккаунт</h2>
            <p>Заполните данные, чтобы начать работу с ProjectFlow.</p>
          </header>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="register-name">Имя</label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                placeholder="Как к вам обращаться?"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">Электронная почта</label>
              <input
                id="register-email"
                type="text"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-password">Пароль</label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                placeholder="Не менее 8 символов"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-confirm-password">
                Повторите пароль
              </label>
              <input
                id="register-confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Введите пароль ещё раз"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
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
              {isSubmitting ? 'Создаём аккаунт...' : 'Создать аккаунт'}
            </button>
          </form>

          <p className="auth-card__switch">
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default RegisterPage;