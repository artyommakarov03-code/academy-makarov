import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Crown,
  KeyRound,
  Rocket,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserRound
} from 'lucide-react';
import { avatarPublicUrl, prepareAvatarFile } from '../lib/profileMedia';
import { supabase } from '../lib/supabase';

const normalizeProfile = (profile) => ({
  nickname: profile.nickname || profile.display_name || '',
  age: profile.age || '',
  bio: profile.bio || '',
  primary_goal: profile.primary_goal || '',
  schedule_details: profile.schedule_details || '',
  preferred_session_minutes: profile.preferred_session_minutes || 45
});

export default function EnhancedAccountPage({ profile, user, isDemo, onProfileUpdate, onExitDemo }) {
  const [form, setForm] = useState(() => normalizeProfile(profile));
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => setForm(normalizeProfile(profile)), [profile]);

  const avatarUrl = useMemo(
    () => avatarPublicUrl(profile.avatar_path, profile.updated_at),
    [profile.avatar_path, profile.updated_at]
  );

  function validateProfile() {
    const nickname = form.nickname.trim();
    const age = Number(form.age);
    if (nickname.length < 2 || nickname.length > 32) {
      return 'Никнейм должен содержать от 2 до 32 символов.';
    }
    if (!Number.isInteger(age) || age < 13 || age > 100) {
      return 'Укажите возраст от 13 до 100 лет.';
    }
    if (form.bio.length > 500) return 'Описание профиля не должно превышать 500 символов.';
    return '';
  }

  async function saveProfile() {
    const validation = validateProfile();
    if (validation) {
      setMessage(validation);
      return;
    }

    const payload = {
      nickname: form.nickname.trim(),
      display_name: form.nickname.trim(),
      age: Number(form.age),
      bio: form.bio.trim() || null,
      primary_goal: form.primary_goal.trim() || null,
      schedule_details: form.schedule_details.trim() || null,
      preferred_session_minutes: Number(form.preferred_session_minutes),
      updated_at: new Date().toISOString()
    };

    if (isDemo) {
      onProfileUpdate({ ...profile, ...payload });
      setMessage('Демо-профиль обновлён локально.');
      return;
    }

    setBusy(true);
    setMessage('');
    const { error } = await supabase.from('profiles').update(payload).eq('user_id', profile.user_id);
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    onProfileUpdate({ ...profile, ...payload });
    setMessage('Профиль сохранён. Данные чата обновятся автоматически.');
  }

  async function uploadAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !user || isDemo) return;

    setAvatarBusy(true);
    setMessage('');
    try {
      const prepared = await prepareAvatarFile(file);
      const path = `${user.id}/avatar.webp`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, prepared, { upsert: true, contentType: 'image/webp', cacheControl: '3600' });
      if (uploadError) throw uploadError;

      const updatedAt = new Date().toISOString();
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_path: path, updated_at: updatedAt })
        .eq('user_id', user.id);
      if (profileError) throw profileError;

      onProfileUpdate({ ...profile, avatar_path: path, updated_at: updatedAt });
      setMessage('Аватар установлен. Он уже будет виден в общем чате.');
    } catch (error) {
      setMessage(error?.message || 'Не удалось загрузить аватар.');
    } finally {
      setAvatarBusy(false);
    }
  }

  async function removeAvatar() {
    if (!user || isDemo || !profile.avatar_path) return;
    setAvatarBusy(true);
    setMessage('');
    try {
      const { error: storageError } = await supabase.storage.from('avatars').remove([profile.avatar_path]);
      if (storageError) throw storageError;
      const updatedAt = new Date().toISOString();
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_path: null, updated_at: updatedAt })
        .eq('user_id', user.id);
      if (error) throw error;
      onProfileUpdate({ ...profile, avatar_path: null, updated_at: updatedAt });
      setMessage('Аватар удалён.');
    } catch (error) {
      setMessage(error?.message || 'Не удалось удалить аватар.');
    } finally {
      setAvatarBusy(false);
    }
  }

  async function changePassword() {
    if (password.length < 8) {
      setMessage('Пароль должен содержать не менее 8 символов.');
      return;
    }
    setBusy(true);
    setMessage('');
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setMessage(error.message);
    else {
      setPassword('');
      setMessage('Пароль изменён.');
    }
  }

  return (
    <div className="page-stack">
      <header className="page-header profile-page-header">
        <div>
          <span className="page-eyebrow">Личный профиль</span>
          <h1>Профиль и настройки обучения</h1>
          <p>Никнейм, аватар и описание видны в общем чате. Возраст, цели и расписание остаются приватными.</p>
        </div>
        {profile.role === 'owner' ? (
          <div className="owner-badge"><Rocket /> Владелец «Новых Знаний»</div>
        ) : (
          <div className="gold-tester-badge"><Crown /> Золотой тестер</div>
        )}
      </header>

      <section className="profile-overview-card">
        <div className="profile-avatar-large">
          {avatarUrl ? <img src={avatarUrl} alt="Аватар пользователя" /> : <UserRound />}
        </div>
        <div className="profile-overview-copy">
          <span>{profile.role === 'owner' ? 'Основатель проекта' : 'Участник сообщества'}</span>
          <h2>{form.nickname || 'Новый пользователь'}</h2>
          <p>{form.bio || 'Описание профиля пока не заполнено.'}</p>
          <div className="profile-status-row">
            <b><Crown /> Золотой тестер</b>
            <span>Статус выдаётся каждому новому пользователю</span>
          </div>
        </div>
        {!isDemo && (
          <div className="avatar-actions">
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={uploadAvatar} />
            <button className="primary" disabled={avatarBusy} onClick={() => inputRef.current?.click()}>
              {avatarBusy ? <Camera /> : <Upload />} {avatarBusy ? 'Обрабатываю…' : 'Загрузить аватар'}
            </button>
            {profile.avatar_path && (
              <button className="secondary" disabled={avatarBusy} onClick={removeAvatar}><Trash2 /> Удалить</button>
            )}
            <small>Изображение автоматически обрезается до квадрата и сохраняется в WebP, максимум 2 МБ.</small>
          </div>
        )}
      </section>

      <section className="account-grid expanded-account-grid">
        <article className="settings-card">
          <div className="section-heading"><div><span>Публичная часть</span><h2>Как вас видит сообщество</h2></div><UserRound /></div>
          <label>Никнейм<input maxLength="32" value={form.nickname} onChange={(event) => setForm({ ...form, nickname: event.target.value })} placeholder="Ваш никнейм" /></label>
          <label>О себе<textarea maxLength="500" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder="Интересы, направления обучения, над чем сейчас работаете…" /></label>
          <div className="field-counter">{form.bio.length}/500</div>
          <label>Возраст <input type="number" min="13" max="100" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} /></label>
          <div className="privacy-note"><ShieldCheck /><p>Возраст хранится в приватном профиле и не отображается в общем чате.</p></div>
        </article>

        <article className="settings-card">
          <div className="section-heading"><div><span>Обучение</span><h2>Персональный контекст</h2></div><Sparkles /></div>
          <label>Главная цель<textarea value={form.primary_goal} onChange={(event) => setForm({ ...form, primary_goal: event.target.value })} /></label>
          <label>Расписание<textarea value={form.schedule_details} onChange={(event) => setForm({ ...form, schedule_details: event.target.value })} /></label>
          <label>Длительность по умолчанию<select value={form.preferred_session_minutes} onChange={(event) => setForm({ ...form, preferred_session_minutes: event.target.value })}>{[15, 30, 45, 60, 75, 90].map((value) => <option key={value} value={value}>{value} минут</option>)}</select></label>
          <button className="primary" disabled={busy} onClick={saveProfile}>Сохранить профиль</button>
        </article>

        <article className="settings-card security-settings-card">
          <div className="section-heading"><div><span>Безопасность</span><h2>Пароль и сессия</h2></div><KeyRound /></div>
          {isDemo ? (
            <>
              <div className="demo-info"><Sparkles /><p>Демо-режим не создаёт аккаунт и не загружает файлы.</p></div>
              <button className="secondary wide" onClick={onExitDemo}>Выйти из демо</button>
            </>
          ) : (
            <>
              <label>Новый пароль<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Не менее 8 символов" /></label>
              <button className="secondary" disabled={busy} onClick={changePassword}>Изменить пароль</button>
              <div className="security-note"><ShieldCheck /><p>Приватные поля защищены Row Level Security. Остальные пользователи получают только данные публичного профиля.</p></div>
            </>
          )}
          {message && <div className="form-message">{message}</div>}
        </article>
      </section>
    </div>
  );
}
