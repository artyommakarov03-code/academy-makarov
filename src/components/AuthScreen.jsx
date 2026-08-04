import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, KeyRound, Mail, PlayCircle, ShieldCheck } from 'lucide-react';
import { appRedirectUrl, supabase } from '../lib/supabase';
import { demoProfiles } from '../data/demoProfiles';

export default function AuthScreen({ recoveryMode, onRecoveryDone, onDemo }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [showDemo, setShowDemo] = useState(false);

  async function submit() {
    if (!email.trim() || password.length < 6) {
      setMessage('Введите email и пароль не короче 6 символов.');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      const result =
        mode === 'login'
          ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
          : await supabase.auth.signUp({
              email: email.trim(),
              password,
              options: { emailRedirectTo: appRedirectUrl() }
            });
      if (result.error) throw result.error;
      setMessage(
        mode === 'login'
          ? 'Вход выполнен.'
          : 'Аккаунт создан. Проверьте почту, если требуется подтверждение.'
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
        redirectTo: appRedirectUrl()
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
          <p>Введите новый пароль для аккаунта Академии.</p>
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
          <div className="brand-symbol">АМ</div>
          <div><b>Академия Макарова</b><span>Персональное обучение до результата</span></div>
        </div>
        <div className="showcase-copy">
          <h1>Преподаватель, который видит не только ответ, но и путь к нему.</h1>
          <p>
            Диагностика, пошаговые подсказки, запуск Python и доказательство самостоятельного
            освоения — в одном занятии.
          </p>
          <div className="showcase-points">
            <article><ShieldCheck /><span><b>Объективная проверка</b>Код проходит реальные тесты в браузере.</span></article>
            <article><PlayCircle /><span><b>Управляемый урок</b>Следующий шаг зависит от ответа и энергии.</span></article>
          </div>
        </div>
        <button className="demo-entry" onClick={() => setShowDemo(true)}>
          <PlayCircle /> Демо для инвестора
        </button>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-tabs">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Вход</button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Регистрация</button>
          </div>
          <h2>{mode === 'login' ? 'Продолжить обучение' : 'Создать личную академию'}</h2>
          <p>
            {mode === 'login'
              ? 'Вернитесь к индивидуальному плану и занятиям.'
              : 'После регистрации Академия проведёт короткую анкету и построит стартовый маршрут.'}
          </p>
          <label>
            Email
            <div className="input-with-icon"><Mail /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></div>
          </label>
          <label>
            Пароль
            <div className="input-with-icon"><KeyRound /><input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submit()} placeholder="Не менее 6 символов" /><button className="show-password" onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff /> : <Eye />}</button></div>
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
