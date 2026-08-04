import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  CheckCircle2,
  Clock3,
  Code2,
  Gauge,
  KeyRound,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  Play,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  X
} from 'lucide-react';
import AuthScreen from './components/AuthScreen';
import Onboarding from './components/Onboarding';
import TutorSession from './components/TutorSession';
import { fallbackScenario } from './data/fallbackScenario';
import { supabase } from './lib/supabase';

const navItems = [
  ['tutor', 'Преподаватель', Bot],
  ['plan', 'Мой план', Target],
  ['progress', 'Прогресс', BarChart3],
  ['account', 'Аккаунт', Settings]
];

function TutorHome({ profile, scenario, minutes, setMinutes, energy, setEnergy, onStart, mastery, isDemo }) {
  const level = Number(profile.subject_levels?.programming || 0);
  const mode = energy <= 3 ? 'Восстановительный' : energy >= 8 ? 'Глубокий фокус' : 'Рабочий режим';
  const completedSkills = mastery.filter((item) => Number(item.mastery) >= 70).length;

  return (
    <div className="page-stack">
      <header className="page-header">
        <div><span className="page-eyebrow">Персональное занятие</span><h1>Добрый вечер, {profile.display_name || 'ученик'}.</h1><p>Преподаватель выбрал один маршрут, который можно доказательно пройти сегодня.</p></div>
        {isDemo && <div className="demo-badge"><Sparkles /> Синтетический профиль</div>}
      </header>

      <section className="tutor-hero">
        <div className="hero-copy">
          <div className="teacher-status"><span><i /> Преподаватель готов</span><b>Investor MVP 0.1</b></div>
          <h2>{scenario.title}</h2>
          <p>{scenario.definition.promise}</p>
          <div className="hero-proof">
            <article><Bot /><div><b>Ведение по шагам</b><span>Следующий вопрос зависит от ответа.</span></div></article>
            <article><Code2 /><div><b>Настоящий Python</b><span>Код исполняется и проходит тесты.</span></div></article>
            <article><Activity /><div><b>Доказательство навыка</b><span>В конце — независимая задача.</span></div></article>
          </div>
        </div>
        <div className="session-config">
          <div className="config-head"><div><span>Параметры занятия</span><h3>{mode}</h3></div><Gauge /></div>
          <label>Доступное время <b>{minutes} минут</b><input type="range" min="15" max="90" step="15" value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} /></label>
          <label>Текущая энергия <b>{energy}/10</b><input type="range" min="1" max="10" value={energy} onChange={(event) => setEnergy(Number(event.target.value))} /></label>
          <div className="config-explanation"><Lightbulb /><p>{energy <= 3 ? 'Преподаватель сократит объяснения и оставит один обязательный перенос.' : energy >= 8 ? 'Можно добавить более сложное объяснение и дополнительный вызов.' : 'Баланс объяснения, совместной практики и самостоятельной проверки.'}</p></div>
          <button className="primary wide large" onClick={onStart}><Play /> Начать занятие</button>
          <small>Первая загрузка Python-движка может занять несколько секунд.</small>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card profile-card"><div className="card-icon"><UserRound /></div><div><span>Персонализация</span><h3>{profile.primary_goal || 'Освоить программирование'}</h3><p>{profile.schedule_details || 'Расписание будет учитываться при подборе нагрузки.'}</p></div><div className="card-metric">Уровень Python <b>{level}/10</b></div></article>
        <article className="dashboard-card"><div className="card-icon green"><CheckCircle2 /></div><div><span>Карта навыков</span><h3>{completedSkills} из 3 подтверждено</h3><p>Прогресс растёт только после объективной проверки.</p></div></article>
        <article className="dashboard-card"><div className="card-icon orange"><Clock3 /></div><div><span>Следующее повторение</span><h3>{mastery.length ? 'По результату занятия' : 'После первой сессии'}</h3><p>Дата зависит от ошибок и количества подсказок.</p></div></article>
      </section>
    </div>
  );
}

function PlanPage({ profile }) {
  const sessionMinutes = profile.preferred_session_minutes || 30;
  const schedule = profile.schedule_type === 'irregular_shift'
    ? 'Занятия запускаются по фактическому свободному окну, без жёсткой привязки к дням.'
    : 'Основной ритм — три занятия и одно короткое повторение в неделю.';
  const days = [
    ['День 1', 'Диагностика и переменные', 'Пройти занятие с преподавателем и независимую задачу.'],
    ['День 2', 'Короткое воспроизведение', 'Без конспекта объяснить присваивание и порядок выполнения.'],
    ['День 3–4', 'Ввод данных', 'Добавить input(), преобразование числа и новый расчёт.'],
    ['День 5–7', 'Условия', 'Научить программу выбирать действие по условию.'],
    ['Неделя 2', 'Мини-проект', 'Собрать персональный калькулятор и объяснить каждую строку.']
  ];
  return (
    <div className="page-stack">
      <header className="page-header"><div><span className="page-eyebrow">14-дневный маршрут</span><h1>План под вашу цель и расписание</h1><p>{schedule}</p></div></header>
      <section className="plan-summary"><article><span>Главная цель</span><b>{profile.primary_goal || 'Освоить Python'}</b></article><article><span>Занятие</span><b>{sessionMinutes} минут</b></article><article><span>Нагрузка</span><b>{profile.weekly_hours || 5} ч/нед.</b></article><article><span>Режим</span><b>Только с преподавателем</b></article></section>
      <div className="timeline">
        {days.map(([when, title, description], index) => <article key={when}><div className="timeline-marker">{index + 1}</div><div><span>{when}</span><h3>{title}</h3><p>{description}</p></div>{index === 0 && <b className="current-label">Текущий шаг</b>}</article>)}
      </div>
    </div>
  );
}

function ProgressPage({ scenario, mastery, sessions, latestSummary }) {
  const rows = scenario.definition.skills.map((skill) => {
    const saved = mastery.find((item) => item.skill_slug === skill.slug);
    const value = Number(saved?.mastery ?? latestSummary?.after?.[skill.slug] ?? skill.baseline);
    return { ...skill, value, nextReview: saved?.next_review_at };
  });
  const average = Math.round(rows.reduce((sum, row) => sum + row.value, 0) / rows.length);
  return (
    <div className="page-stack">
      <header className="page-header"><div><span className="page-eyebrow">Доказательства обучения</span><h1>Прогресс, основанный на действиях</h1><p>Не «урок просмотрен», а ответы, тесты, подсказки и самостоятельный перенос.</p></div><div className="overall-ring"><b>{average}%</b><span>среднее освоение</span></div></header>
      <section className="skill-board">
        {rows.map((row) => <article key={row.slug}><div className="skill-title"><div><b>{row.title}</b><span>{row.nextReview ? `Повтор: ${new Date(row.nextReview).toLocaleDateString('ru-RU')}` : 'Ожидает первой проверки'}</span></div><strong>{row.value}%</strong></div><div className="skill-track"><i style={{ width: `${row.value}%` }} /></div></article>)}
      </section>
      <section className="evidence-section"><div className="section-heading"><div><span>История занятий</span><h2>Последние доказательства</h2></div><ShieldCheck /></div>{sessions.length ? <div className="session-table">{sessions.map((session) => <article key={session.id}><div><b>{session.status === 'completed' ? 'Занятие завершено' : 'Незавершённая сессия'}</b><span>{new Date(session.started_at).toLocaleString('ru-RU')}</span></div><strong>{session.result?.overall ? `${session.result.overall}%` : '—'}</strong><small>{session.result?.independent ? 'Самостоятельный перенос подтверждён' : 'Требуется повтор'}</small></article>)}</div> : <div className="empty-state"><Activity /><h3>Здесь появится первая сессия</h3><p>Пройдите занятие, чтобы увидеть измеримый рост навыков.</p></div>}</section>
    </div>
  );
}

function AccountPage({ profile, isDemo, onProfileUpdate, onExitDemo }) {
  const [form, setForm] = useState({
    display_name: profile.display_name || '',
    primary_goal: profile.primary_goal || '',
    schedule_details: profile.schedule_details || '',
    preferred_session_minutes: profile.preferred_session_minutes || 30
  });
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function saveProfile() {
    if (isDemo) {
      onProfileUpdate({ ...profile, ...form });
      setMessage('Демо-профиль обновлён локально.');
      return;
    }
    setBusy(true);
    const payload = { ...form, preferred_session_minutes: Number(form.preferred_session_minutes), updated_at: new Date().toISOString() };
    const { error } = await supabase.from('profiles').update(payload).eq('user_id', profile.user_id);
    setBusy(false);
    if (error) setMessage(error.message);
    else { onProfileUpdate({ ...profile, ...payload }); setMessage('Профиль сохранён.'); }
  }

  async function changePassword() {
    if (password.length < 8) { setMessage('Пароль должен содержать не менее 8 символов.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setMessage(error.message);
    else { setPassword(''); setMessage('Пароль изменён.'); }
  }

  return (
    <div className="page-stack">
      <header className="page-header"><div><span className="page-eyebrow">Персональная среда</span><h1>Аккаунт и параметры обучения</h1><p>Эти настройки влияют на длительность, сложность и способ ведения занятия.</p></div>{profile.role === 'owner' && <div className="owner-badge"><Rocket /> Владелец Академии</div>}</header>
      <section className="account-grid">
        <article className="settings-card"><div className="section-heading"><div><span>Профиль</span><h2>Учебный контекст</h2></div><UserRound /></div><label>Имя<input value={form.display_name} onChange={(event) => setForm({ ...form, display_name: event.target.value })} /></label><label>Главная цель<textarea value={form.primary_goal} onChange={(event) => setForm({ ...form, primary_goal: event.target.value })} /></label><label>Расписание<textarea value={form.schedule_details} onChange={(event) => setForm({ ...form, schedule_details: event.target.value })} /></label><label>Длительность занятия<select value={form.preferred_session_minutes} onChange={(event) => setForm({ ...form, preferred_session_minutes: event.target.value })}><option value="15">15 минут</option><option value="30">30 минут</option><option value="45">45 минут</option><option value="60">60 минут</option><option value="90">90 минут</option></select></label><button className="primary" disabled={busy} onClick={saveProfile}>Сохранить настройки</button></article>
        <article className="settings-card"><div className="section-heading"><div><span>Безопасность</span><h2>Пароль и сессия</h2></div><KeyRound /></div>{isDemo ? <><div className="demo-info"><Sparkles /><p>Демо-режим не создаёт аккаунт и не хранит персональные данные.</p></div><button className="secondary wide" onClick={onExitDemo}>Выйти из демо</button></> : <><label>Новый пароль<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Не менее 8 символов" /></label><button className="secondary" disabled={busy} onClick={changePassword}>Изменить пароль</button><div className="security-note"><ShieldCheck /><p>Восстановление пароля доступно на экране входа через email.</p></div></>}{message && <div className="form-message">{message}</div>}</article>
      </section>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [demoProfile, setDemoProfile] = useState(null);
  const [scenario, setScenario] = useState(fallbackScenario);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [page, setPage] = useState('tutor');
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTutor, setActiveTutor] = useState(false);
  const [minutes, setMinutes] = useState(30);
  const [energy, setEnergy] = useState(6);
  const [mastery, setMastery] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [latestSummary, setLatestSummary] = useState(null);

  const activeProfile = demoProfile || profile;
  const isDemo = Boolean(demoProfile);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
      setUser(session?.user || null);
      if (!session) setProfile(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadScenario() {
      const { data } = await supabase.from('tutor_scenarios').select('*').eq('slug', fallbackScenario.slug).maybeSingle();
      if (data) setScenario(data);
    }
    loadScenario();
  }, []);

  useEffect(() => {
    if (!user || demoProfile) return;
    async function loadUserData() {
      const [{ data: profileData }, { data: masteryData }, { data: sessionData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('skill_mastery').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
        supabase.from('tutor_sessions').select('id,status,started_at,ended_at,result').eq('user_id', user.id).order('started_at', { ascending: false }).limit(10)
      ]);
      setProfile(profileData || { user_id: user.id, onboarding_completed: false });
      setMastery(masteryData || []);
      setSessions(sessionData || []);
      if (profileData?.preferred_session_minutes) setMinutes(profileData.preferred_session_minutes);
    }
    loadUserData();
  }, [user, demoProfile]);

  const currentNav = useMemo(() => navItems.find(([id]) => id === page), [page]);

  function enterDemo(selectedProfile) {
    setDemoProfile(selectedProfile);
    setProfile(null);
    setMinutes(selectedProfile.preferred_session_minutes);
    setEnergy(selectedProfile.energy_pattern === 'variable' ? 5 : selectedProfile.energy_pattern === 'high_evening' ? 8 : 7);
    setMastery([]);
    setSessions([]);
    setPage('tutor');
  }

  function exitDemo() {
    setDemoProfile(null);
    setLatestSummary(null);
    setActiveTutor(false);
  }

  function handleTutorComplete(summary) {
    setLatestSummary(summary);
    const localMastery = scenario.definition.skills.map((skill) => ({
      skill_slug: skill.slug,
      skill_title: skill.title,
      mastery: summary.after[skill.slug],
      next_review_at: new Date(Date.now() + (summary.overall >= 80 ? 3 : 1) * 86400000).toISOString()
    }));
    setMastery(localMastery);
    setSessions((current) => [{ id: crypto.randomUUID(), status: 'completed', started_at: new Date().toISOString(), result: summary }, ...current]);
  }

  if (loading) return <div className="full-loader"><div className="brand-symbol">АМ</div><span>Загружаю Академию…</span></div>;
  if (recoveryMode) return <AuthScreen recoveryMode onRecoveryDone={() => setRecoveryMode(false)} onDemo={enterDemo} />;
  if (!user && !demoProfile) return <AuthScreen recoveryMode={false} onRecoveryDone={() => {}} onDemo={enterDemo} />;
  if (user && profile && !profile.onboarding_completed) return <Onboarding user={user} onComplete={(newProfile) => { setProfile(newProfile); setMinutes(newProfile.preferred_session_minutes); }} />;
  if (!activeProfile) return <div className="full-loader"><span>Подготавливаю профиль…</span></div>;

  return (
    <div className="academy-shell">
      <aside className={menuOpen ? 'app-sidebar open' : 'app-sidebar'}>
        <div className="sidebar-head"><div className="brand-lockup compact"><div className="brand-symbol">АМ</div><div><b>Академия Макарова</b><span>{isDemo ? 'Инвесторское демо' : 'Персональная среда'}</span></div></div><button className="mobile-close" onClick={() => setMenuOpen(false)}><X /></button></div>
        <nav>
          {navItems.map(([id, label, Icon]) => <button key={id} className={page === id ? 'active' : ''} onClick={() => { setPage(id); setMenuOpen(false); }}><Icon /><span>{label}</span>{id === 'tutor' && <i />}</button>)}
        </nav>
        <div className="sidebar-profile"><div className="profile-avatar">{activeProfile.display_name?.[0] || 'У'}</div><div><b>{activeProfile.display_name || 'Ученик'}</b><span>{isDemo ? 'Демо-профиль' : activeProfile.role === 'owner' ? 'Владелец' : 'Ученик'}</span></div></div>
        {isDemo ? <button className="sidebar-action" onClick={exitDemo}><LogOut /> Выйти из демо</button> : <button className="sidebar-action" onClick={() => supabase.auth.signOut()}><LogOut /> Выйти</button>}
      </aside>

      <main className="academy-main">
        <div className="mobile-topbar"><button onClick={() => setMenuOpen(true)}><Menu /></button><div><b>{currentNav?.[1]}</b><span>Академия Макарова</span></div></div>
        {page === 'tutor' && <TutorHome profile={activeProfile} scenario={scenario} minutes={minutes} setMinutes={setMinutes} energy={energy} setEnergy={setEnergy} onStart={() => setActiveTutor(true)} mastery={mastery} isDemo={isDemo} />}
        {page === 'plan' && <PlanPage profile={activeProfile} />}
        {page === 'progress' && <ProgressPage scenario={scenario} mastery={mastery} sessions={sessions} latestSummary={latestSummary} />}
        {page === 'account' && <AccountPage profile={activeProfile} isDemo={isDemo} onProfileUpdate={(updated) => isDemo ? setDemoProfile(updated) : setProfile(updated)} onExitDemo={exitDemo} />}
        <footer className="app-footer"><span>Investor MVP 0.1</span><span>GitHub Pages · Supabase · Pyodide</span><span>Нулевой обязательный бюджет</span></footer>
      </main>

      {activeTutor && <TutorSession scenario={scenario} profile={activeProfile} user={user} isDemo={isDemo} minutes={minutes} energy={energy} onExit={() => setActiveTutor(false)} onComplete={handleTutorComplete} />}
    </div>
  );
}
