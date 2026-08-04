import { useState } from 'react';
import {
  ArrowRight,
  Cake,
  Crown,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  PlayCircle,
  ShieldCheck,
  UserRound
} from 'lucide-react';
import { appRedirectUrl, supabase } from '../lib/supabase';
import { demoProfiles } from '../data/demoProfiles';

export default function AuthScreen({ recoveryMode, onRecoveryDone, onDemo }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [showDemo, setShowDemo] = useState(false);

  function validateRegistration() {
    if (nickname.trim().length < 2 || nickname.trim().length > 32) {
      return 'Никнейм должен содержать от 2 до 32 символов.';
    }
    const numericAge = Number(age);
    if (!Number.isInteger(numericAge) || numericAge < 13 || numericAge > 100) {
      return 'Укажите возраст от 13 до 100 лет.';
    }
    return '';
  }

  async function submit() {
    if (!email.trim() || password.length < 6) {
      setMessage('Введите email и пароль не короче 6 символов.');
      return;
    }
    if (mode === 'register') {
      const validation = validateRegistration();
      if (validation) {
        setMessage(validation);
        return;
      }
    }

    setBusy(true);
    setMessage('');
    try {
      const result = mode === 'login'
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              emailRedirectTo: appRedirectUrl(),
              data: {
                nickname: nickname.trim(),
                display_name: nickname.trim(),
                age: Number(age),
                tester_tier: 'gold'
              }
            }
          });
      if (result.error) throw result.error;
      setMessage(
        mode === 'login'
          ? 'Вход выполнен.'
          : 'Аккаунт создан. Вам присвоен золотой статус тестера. Проверьте почту, если требуется подтверждение.'
      );
    } catch (error) {
      setMessage(error?.message || 'Не удалось выполнить запрос.');
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!email.trim()) {
      setMessage('Сначала введите email аккаунта.');
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: appRedirectUrl({ recovery: true })
      });
      if (error) throw error;
      setMessage('Ссылка для восстановления отправлена на почту.');
    } catch (error) {
      setMessage(error?.message || 'Не удалось отправить письмо.');
    } finally {
      setBusy(false);
    }
  }

  async function saveNewPassword() {
    if (newPassword.length < 8) {
      setMessage('Новый пароль должен содержать не менее 8 символов.');
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      window.history.replaceState({}, document.title, appRedirectUrl());
      setMessage('Пароль изменён.');
      onRecoveryDone();
    } catch (error) {
      setMessage(error?.message || 'Не удалось изменить пароль.');
    } finally {
      setBusy(false);
    }
  }

  if (recoveryMode) {
    return (
      <main className="auth-page">
        <section className="auth-card recovery-card">
          <div className="auth-mark"><KeyRound /></div>
          <h1>Новый пароль</h1>
          <p>Введите новый пароль для аккаунта «Новых Знаний».</p>
          <label>
            Новый пароль
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Не менее 8 символов"
            />
          </label>
          <button className="primary wide" disabled={busy} onClick={saveNewPassword}>
            Сохранить пароль <ArrowRight />
          </button>
          {message && <div className="form-message">{message}</div>}
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-showcase">
        <div className="brand-lockup">
          <div className="brand-symbol">НЗ</div>
          <div><b>Новые Знания</b><span>by Макаров</span></div>
        </div>
        <div className="showcase-copy">
          <h1>Преподаватель, который видит не только ответ, но и путь к нему.</h1>
          <p>
            Диагностика, мини-игры, пошаговые подсказки, запуск Python и доказательство
            самостоятельного освоения — в одной среде.
          </p>
          <div className="showcase-points">
            <article><ShieldCheck /><span><b>Объективная проверка</b>Ответы и код проверяются отдельным учебным движком.</span></article>
            <article><Crown /><span><b>Золотой тестер</b>Каждый новый пользователь получает статус участника раннего сообщества.</span></article>
          </div>
        </div>
        <button className="demo-entry" onClick={() => setShowDemo(true)}>
          <PlayCircle /> Демо для инвестора
        </button>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setMessage(''); }}>Вход</button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setMessage(''); }}>Регистрация</button>
          </div>
          <h2>{mode === 'login' ? 'Продолжить обучение' : 'Создать профиль тестера'}</h2>
          <p>
            {mode === 'login'
              ? 'Вернитесь к индивидуальному плану, общему чату и занятиям.'
              : 'Никнейм и аватар будут видны сообществу. Возраст останется приватным.'}
          </p>

          {mode === 'register' && (
            <div className="registration-profile-fields">
              <label>
                Никнейм
                <div className="input-with-icon"><UserRound /><input maxLength="32" value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="Как вас называть в чате" /></div>
              </label>
              <label>
                Возраст
                <div className="input-with-icon"><Cake /><input type="number" min="13" max="100" value={age} onChange={(event) => setAge(event.target.value)} placeholder="Например, 23" /></div>
              </label>
              <div className="registration-gold-note"><Crown /><span><b>Золотой тестер</b>Статус присваивается автоматически после регистрации.</span></div>
            </div>
          )}

          <label>
            Email
            <div className="input-with-icon"><Mail /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></div>
          </label>
          <label>
            Пароль
            <div className="input-with-icon"><KeyRound /><input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submit()} placeholder="Не менее 6 символов" /><button type="button" className="show-password" onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff /> : <Eye />}</button></div>
          </label>
          <button className="primary wide" disabled={busy} onClick={submit}>
            {busy ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'} <ArrowRight />
          </button>
          {mode === 'login' && <button className="text-button" disabled={busy} onClick={resetPassword}>Забыли пароль?</button>}
          {message && <div className="form-message">{message}</div>}
        </div>
      </section>

      {showDemo && (
        <div className="modal-backdrop" onMouseDown={() => setShowDemo(false)}>
          <section className="demo-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-heading"><div><span>Демонстрационный режим</span><h2>Выберите профиль ученика</h2></div><button onClick={() => setShowDemo(false)}>×</button></div>
            <div className="demo-grid">
              {demoProfiles.map((profile) => (
                <button key={profile.id} onClick={() => onDemo(profile)}>
                  <b>{profile.label}</b>
                  <p>{profile.description}</p>
                  <span>{profile.preferred_session_minutes} минут · уровень {profile.subject_levels.programming}/10</span>
                </button>
              ))}
            </div>
            <small>Используются синтетические данные. Регистрация не требуется.</small>
          </section>
        </div>
      )}
    </main>
  );
}
