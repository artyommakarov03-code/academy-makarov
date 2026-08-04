import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  BrainCircuit,
  Calculator,
  CheckCircle2,
  Clock3,
  Code2,
  Crown,
  Gauge,
  KeyRound,
  Languages,
  Lightbulb,
  LogOut,
  Menu,
  MessageCircle,
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
import AdaptiveTutorSession from './components/AdaptiveTutorSession';
import CommunityChat from './components/CommunityChat';
import EnhancedAccountPage from './components/EnhancedAccountPage';
import { buildAdaptivePlan, subjectScenarios } from './data/subjectScenarios';
import { supabase } from './lib/supabase';
import { avatarPublicUrl } from './lib/profileMedia';
import './adaptive-academy.css';

const subjectIcons = {
  cognition: BrainCircuit,
  programming: Code2,
  english: Languages,
  russian: BookOpen,
  math: Calculator
};

const navItems = [
  ['tutor', 'Преподаватель', Bot],
  ['plan', 'Мой план', Target],
  ['progress', 'Прогресс', BarChart3],
  ['chat', 'Общий чат', MessageCircle],
  ['account', 'Аккаунт', Settings]
];

function TutorHome({ profile, selectedSubject, setSelectedSubject, minutes, setMinutes, energy, setEnergy, onStart, mastery, isDemo }) {
  const scenario = subjectScenarios.find((item) => item.subject === selectedSubject) || subjectScenarios[0];
  const plan = useMemo(() => buildAdaptivePlan(scenario, minutes, energy), [scenario, minutes, energy]);
  const completedSkills = scenario.definition.skills.filter((skill) => mastery.find((item) => item.skill_slug === skill.slug && Number(item.mastery) >= 70)).length;

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="page-eyebrow">Персональное адаптивное занятие</span>
          <h1>Добрый вечер, {profile.display_name || 'ученик'}.</h1>
          <p>Выбери предмет, время и состояние. Эти параметры меняют реальное содержание занятия.</p>
        </div>
        {isDemo && <div className="demo-badge"><Sparkles /> Синтетический профиль</div>}
      </header>

      <section className="subject-section">
        <div className="section-heading"><div><span>Шаг 1</span><h2>Выбери предмет</h2></div><BookOpen /></div>
        <div className="subject-grid">
          {subjectScenarios.map((item) => {
            const Icon = subjectIcons[item.subject];
            const active = item.subject === selectedSubject;
            return (
              <button key={item.subject} className={`subject-card ${item.accent} ${active ? 'active' : ''}`} onClick={() => setSelectedSubject(item.subject)}>
                <div className="subject-icon"><Icon /></div>
                <div><b>{item.title}</b><span>{item.description}</span></div>
                {item.subject === 'cognition' && <small>Самый проработанный банк</small>}
                {active && <CheckCircle2 className="subject-check" />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="tutor-hero adaptive-hero">
        <div className="hero-copy">
          <div className="teacher-status"><span><i /> Преподаватель готов</span><b>Adaptive MVP 0.2</b></div>
          <h2>{scenario.title}</h2>
          <p>{scenario.definition.promise}</p>
          <div className="plan-impact-grid">
            <article><b>{plan.targetCount}</b><span>задач в этом занятии</span></article>
            <article><b>{plan.maxDifficulty}/5</b><span>максимальная сложность</span></article>
            <article><b>{plan.mode}</b><span>{plan.explanationStyle}</span></article>
          </div>
          <div className="hero-proof">
            <article><Bot /><div><b>ИИ объясняет ошибки</b><span>Gemini формулирует обратную связь, движок проверяет ответ.</span></div></article>
            <article><Activity /><div><b>Объективная проверка</b><span>Ответы, код, попытки и подсказки сохраняются.</span></div></article>
            <article><BrainCircuit /><div><b>Перенос навыка</b><span>При высокой энергии появляются более сложные задачи.</span></div></article>
          </div>
        </div>

        <div className="session-config">
          <div className="config-head"><div><span>Шаг 2 · параметры</span><h3>{plan.mode}</h3></div><Gauge /></div>
          <label>Доступное время <b>{minutes} минут</b><input type="range" min="15" max="90" step="15" value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} /></label>
          <div className="range-ticks"><span>15</span><span>30</span><span>45</span><span>60</span><span>75</span><span>90</span></div>
          <label>Текущая энергия <b>{energy}/10</b><input type="range" min="1" max="10" value={energy} onChange={(event) => setEnergy(Number(event.target.value))} /></label>
          <div className="config-explanation"><Lightbulb /><p>{energy <= 3 ? 'Задач будет меньше, сложность ограничена, объяснения короче и опор больше.' : energy >= 8 ? 'Добавляется одна задача, повышается потолок сложности и уменьшается объём прямых подсказок.' : 'Сохраняется рабочий баланс между объяснением, практикой и переносом.'}</p></div>
          <div className="session-plan-line"><span><Clock3 /> {minutes} минут</span><span><Target /> {plan.targetCount} задач</span><span><Gauge /> до {plan.maxDifficulty}/5</span></div>
          <button className="primary wide large" onClick={onStart}><Play /> Начать занятие по предмету</button>
          <small>{scenario.subject === 'programming' ? 'В задачах по Python код исполняется прямо в браузере.' : 'ИИ не определяет правильность — он только объясняет результат проверки.'}</small>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card profile-card"><div className="card-icon"><UserRound /></div><div><span>Текущий предмет</span><h3>{scenario.shortTitle}</h3><p>{scenario.description}</p></div><div className="card-metric">Навыков <b>{scenario.definition.skills.length}</b></div></article>
        <article className="dashboard-card"><div className="card-icon green"><CheckCircle2 /></div><div><span>Карта навыков</span><h3>{completedSkills} из {scenario.definition.skills.length} подтверждено</h3><p>Порог подтверждения — 70% по объективным действиям.</p></div></article>
        <article className="dashboard-card"><div className="card-icon orange"><Clock3 /></div><div><span>Адаптация времени</span><h3>60 / 75 / 90 — разные уроки</h3><p>Чем длиннее окно, тем больше задач и шире охват навыков.</p></div></article>
      </section>
    </div>
  );
}

function PlanPage({ profile, scenario }) {
  const steps = {
    cognition: [['Сессия 1', 'Импульсивные ошибки', 'Задачи на торможение первого ответа и точное чтение.'], ['Сессия 2', 'Логические условия', 'Проверка правил, контрпримеры и необходимые выводы.'], ['Сессия 3', 'Вероятности', 'Базовые частоты, условная вероятность и ловушки интуиции.'], ['Сессия 4', 'Стратегический перенос', 'Новые задачи без повторения знакомой формулировки.']],
    programming: [['Сессия 1', 'Переменные', 'Присваивание и порядок выполнения.'], ['Сессия 2', 'Ввод данных', 'input(), числа и вычисления.'], ['Сессия 3', 'Условия', 'Выбор действия программой.'], ['Сессия 4', 'Мини-проект', 'Рабочий калькулятор с тестами.']],
    english: [['Сессия 1', 'Глагол be', 'Утверждение, отрицание и вопрос.'], ['Сессия 2', 'Порядок слов', 'Сборка коротких предложений.'], ['Сессия 3', 'Артикли', 'Первое и повторное упоминание.'], ['Сессия 4', 'Мини-диалог', 'Понимание и самостоятельный ответ.']],
    russian: [['Сессия 1', 'Точность нормы', 'Частые грамматические и орфографические ошибки.'], ['Сессия 2', 'Пунктуация', 'Связи между частями предложения.'], ['Сессия 3', 'Точность смысла', 'Двусмысленность и лишние слова.'], ['Сессия 4', 'Редактирование', 'Исправление цельного короткого текста.']],
    math: [['Сессия 1', 'Порядок действий', 'Вычисления и объяснение каждого шага.'], ['Сессия 2', 'Дроби и проценты', 'Связь разных форм числа.'], ['Сессия 3', 'Уравнения', 'Равносильные преобразования.'], ['Сессия 4', 'Текстовые задачи', 'Перевод условия в математическую модель.']]
  }[scenario.subject];

  return (
    <div className="page-stack">
      <header className="page-header"><div><span className="page-eyebrow">Маршрут по предмету</span><h1>{scenario.title}</h1><p>План сохраняет направление, но объём каждой сессии выбирается по реальному времени и энергии.</p></div></header>
      <section className="plan-summary"><article><span>Главная цель</span><b>{profile.primary_goal || 'Системное развитие'}</b></article><article><span>Обычное занятие</span><b>{profile.preferred_session_minutes || 45} минут</b></article><article><span>Навыков в первом уроке</span><b>{scenario.definition.skills.length}</b></article><article><span>Режим</span><b>Преподаватель + проверка</b></article></section>
      <div className="timeline">{steps.map(([when, title, description], index) => <article key={title}><div className="timeline-marker">{index + 1}</div><div><span>{when}</span><h3>{title}</h3><p>{description}</p></div>{index === 0 && <b className="current-label">Доступно сейчас</b>}</article>)}</div>
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
  const subjectSessions = sessions.filter((session) => session.scenario_slug === scenario.slug || session.result?.scenarioSlug === scenario.slug);

  return (
    <div className="page-stack">
      <header className="page-header"><div><span className="page-eyebrow">Доказательства · {scenario.shortTitle}</span><h1>Прогресс по выбранному предмету</h1><p>Результат учитывает правильность, число попыток, подсказки и сложность пройденных задач.</p></div><div className="overall-ring"><b>{average}%</b><span>среднее освоение</span></div></header>
      <section className="skill-board">{rows.map((row) => <article key={row.slug}><div className="skill-title"><div><b>{row.title}</b><span>{row.nextReview ? `Повтор: ${new Date(row.nextReview).toLocaleDateString('ru-RU')}` : 'Ожидает проверки'}</span></div><strong>{row.value}%</strong></div><div className="skill-track"><i style={{ width: `${row.value}%` }} /></div></article>)}</section>
      <section className="evidence-section"><div className="section-heading"><div><span>История предмета</span><h2>Последние занятия</h2></div><ShieldCheck /></div>{subjectSessions.length ? <div className="session-table">{subjectSessions.map((session) => <article key={session.id}><div><b>{session.status === 'completed' ? 'Занятие завершено' : 'Незавершённая сессия'}</b><span>{new Date(session.started_at).toLocaleString('ru-RU')}</span></div><strong>{session.result?.overall ? `${session.result.overall}%` : '—'}</strong><small>{session.result?.taskCount ? `${session.result.correctTasks}/${session.result.taskCount} задач` : 'Результат не сформирован'}</small></article>)}</div> : <div className="empty-state"><Activity /><h3>По этому предмету ещё нет сессий</h3><p>Пройди занятие, чтобы увидеть измеримый рост.</p></div>}</section>
    </div>
  );
}

function AccountPage({ profile, isDemo, onProfileUpdate, onExitDemo }) {
  const [form, setForm] = useState({ display_name: profile.display_name || '', primary_goal: profile.primary_goal || '', schedule_details: profile.schedule_details || '', preferred_session_minutes: profile.preferred_session_minutes || 45 });
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function saveProfile() {
    if (isDemo) { onProfileUpdate({ ...profile, ...form }); setMessage('Демо-профиль обновлён локально.'); return; }
    setBusy(true);
    const payload = { ...form, preferred_session_minutes: Number(form.preferred_session_minutes), updated_at: new Date().toISOString() };
    const { error } = await supabase.from('profiles').update(payload).eq('user_id', profile.user_id);
    setBusy(false);
    if (error) setMessage(error.message); else { onProfileUpdate({ ...profile, ...payload }); setMessage('Профиль сохранён.'); }
  }

  async function changePassword() {
    if (password.length < 8) { setMessage('Пароль должен содержать не менее 8 символов.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setMessage(error.message); else { setPassword(''); setMessage('Пароль изменён.'); }
  }

  return (
    <div className="page-stack">
      <header className="page-header"><div><span className="page-eyebrow">Персональная среда</span><h1>Аккаунт и параметры обучения</h1><p>Предпочтительная длительность станет стартовым значением, но перед каждой сессией её можно изменить.</p></div>{profile.role === 'owner' && <div className="owner-badge"><Rocket /> Владелец Академии</div>}</header>
      <section className="account-grid">
        <article className="settings-card"><div className="section-heading"><div><span>Профиль</span><h2>Учебный контекст</h2></div><UserRound /></div><label>Имя<input value={form.display_name} onChange={(event) => setForm({ ...form, display_name: event.target.value })} /></label><label>Главная цель<textarea value={form.primary_goal} onChange={(event) => setForm({ ...form, primary_goal: event.target.value })} /></label><label>Расписание<textarea value={form.schedule_details} onChange={(event) => setForm({ ...form, schedule_details: event.target.value })} /></label><label>Длительность по умолчанию<select value={form.preferred_session_minutes} onChange={(event) => setForm({ ...form, preferred_session_minutes: event.target.value })}>{[15, 30, 45, 60, 75, 90].map((value) => <option key={value} value={value}>{value} минут</option>)}</select></label><button className="primary" disabled={busy} onClick={saveProfile}>Сохранить настройки</button></article>
        <article className="settings-card"><div className="section-heading"><div><span>Безопасность</span><h2>Пароль и сессия</h2></div><KeyRound /></div>{isDemo ? <><div className="demo-info"><Sparkles /><p>Демо-режим не создаёт аккаунт и не хранит персональные данные.</p></div><button className="secondary wide" onClick={onExitDemo}>Выйти из демо</button></> : <><label>Новый пароль<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Не менее 8 символов" /></label><button className="secondary" disabled={busy} onClick={changePassword}>Изменить пароль</button><div className="security-note"><ShieldCheck /><p>Данные каждого ученика ограничены политиками Row Level Security.</p></div></>}{message && <div className="form-message">{message}</div>}</article>
      </section>
    </div>
  );
}

export default function AppV2() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [demoProfile, setDemoProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(() => {
    const search = new URLSearchParams(window.location.search);
    return search.get('recovery') === '1' || window.location.hash.includes('type=recovery');
  });
  const [page, setPage] = useState('tutor');
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTutor, setActiveTutor] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('cognition');
  const [minutes, setMinutes] = useState(45);
  const [energy, setEnergy] = useState(6);
  const [mastery, setMastery] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [latestSummary, setLatestSummary] = useState(null);

  const activeProfile = demoProfile || profile;
  const isDemo = Boolean(demoProfile);
  const scenario = subjectScenarios.find((item) => item.subject === selectedSubject) || subjectScenarios[0];
  const currentNav = useMemo(() => navItems.find(([id]) => id === page), [page]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user || null;
      setUser(sessionUser);
      if (sessionUser && new URLSearchParams(window.location.search).get('recovery') === '1') {
        setRecoveryMode(true);
      }
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
    if (!user || demoProfile) return;
    async function loadUserData() {
      const [{ data: profileData }, { data: masteryData }, { data: sessionData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('skill_mastery').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
        supabase.from('tutor_sessions').select('id,status,scenario_slug,started_at,ended_at,result').eq('user_id', user.id).order('started_at', { ascending: false }).limit(30)
      ]);
      setProfile(profileData || { user_id: user.id, onboarding_completed: false });
      setMastery(masteryData || []);
      setSessions(sessionData || []);
      if (profileData?.preferred_session_minutes) setMinutes(profileData.preferred_session_minutes);
    }
    loadUserData();
  }, [user, demoProfile]);

  function enterDemo(selectedProfile) {
    setDemoProfile(selectedProfile);
    setProfile(null);
    setMinutes(selectedProfile.preferred_session_minutes || 45);
    setEnergy(selectedProfile.energy_pattern === 'variable' ? 5 : selectedProfile.energy_pattern === 'high_evening' ? 8 : 7);
    setMastery([]);
    setSessions([]);
    setPage('tutor');
  }

  function exitDemo() { setDemoProfile(null); setLatestSummary(null); setActiveTutor(false); }

  function handleTutorComplete(summary) {
    setLatestSummary(summary);
    const localMastery = scenario.definition.skills.map((skill) => ({ skill_slug: skill.slug, skill_title: skill.title, mastery: summary.after[skill.slug], next_review_at: new Date(Date.now() + (summary.overall >= 80 ? 3 : 1) * 86400000).toISOString() }));
    setMastery((current) => [...current.filter((item) => !localMastery.some((next) => next.skill_slug === item.skill_slug)), ...localMastery]);
    setSessions((current) => [{ id: crypto.randomUUID(), status: 'completed', scenario_slug: scenario.slug, started_at: new Date().toISOString(), result: summary }, ...current]);
  }

  if (loading) return <div className="full-loader"><div className="brand-symbol">НЗ</div><span>Загружаю Новые Знания…</span></div>;
  if (recoveryMode) return <AuthScreen recoveryMode onRecoveryDone={() => setRecoveryMode(false)} onDemo={enterDemo} />;
  if (!user && !demoProfile) return <AuthScreen recoveryMode={false} onRecoveryDone={() => {}} onDemo={enterDemo} />;
  if (user && profile && !profile.onboarding_completed) return <Onboarding user={user} initialProfile={profile} onComplete={(newProfile) => { setProfile(newProfile); setMinutes(newProfile.preferred_session_minutes); }} />;
  if (!activeProfile) return <div className="full-loader"><span>Подготавливаю профиль…</span></div>;

  return (
    <div className="academy-shell">
      <aside className={menuOpen ? 'app-sidebar open' : 'app-sidebar'}>
        <div className="sidebar-head"><div className="brand-lockup compact"><div className="brand-symbol">НЗ</div><div><b>Новые Знания</b><span>by Макаров</span></div></div><button className="mobile-close" onClick={() => setMenuOpen(false)}><X /></button></div>
        <nav>{navItems.filter(([id]) => !isDemo || id !== 'chat').map(([id, label, Icon]) => <button key={id} className={page === id ? 'active' : ''} onClick={() => { setPage(id); setMenuOpen(false); }}><Icon /><span>{label}</span>{id === 'tutor' && <i />}{id === 'chat' && !isDemo && <i className="community-nav-badge" />}</button>)}</nav>
        <div className="sidebar-subject"><span>Текущий предмет</span><b>{scenario.shortTitle}</b></div>
        <div className="sidebar-profile"><div className="sidebar-profile-avatar">{activeProfile.avatar_path ? <img src={avatarPublicUrl(activeProfile.avatar_path, activeProfile.updated_at)} alt="" /> : (activeProfile.nickname || activeProfile.display_name)?.[0] || 'У'}</div><div className="sidebar-profile-meta"><b>{activeProfile.nickname || activeProfile.display_name || 'Ученик'}</b><span className={!isDemo && activeProfile.role !== 'owner' ? 'sidebar-gold-label' : ''}>{isDemo ? 'Демо-профиль' : activeProfile.role === 'owner' ? 'Владелец' : <><Crown /> Золотой тестер</>}</span></div></div>
        {isDemo ? <button className="sidebar-action" onClick={exitDemo}><LogOut /> Выйти из демо</button> : <button className="sidebar-action" onClick={() => supabase.auth.signOut()}><LogOut /> Выйти</button>}
      </aside>

      <main className="academy-main">
        <div className="mobile-topbar"><button onClick={() => setMenuOpen(true)}><Menu /></button><div><b>{currentNav?.[1]}</b><span>{scenario.shortTitle}</span></div></div>
        {page === 'tutor' && <TutorHome profile={activeProfile} selectedSubject={selectedSubject} setSelectedSubject={(subject) => { setSelectedSubject(subject); setLatestSummary(null); }} minutes={minutes} setMinutes={setMinutes} energy={energy} setEnergy={setEnergy} onStart={() => setActiveTutor(true)} mastery={mastery} isDemo={isDemo} />}
        {page === 'plan' && <PlanPage profile={activeProfile} scenario={scenario} />}
        {page === 'progress' && <ProgressPage scenario={scenario} mastery={mastery} sessions={sessions} latestSummary={latestSummary?.subject === scenario.subject ? latestSummary : null} />}
        {page === 'chat' && <CommunityChat user={user} profile={activeProfile} isDemo={isDemo} />}
        {page === 'account' && <EnhancedAccountPage profile={activeProfile} user={user} isDemo={isDemo} onProfileUpdate={(updated) => isDemo ? setDemoProfile(updated) : setProfile(updated)} onExitDemo={exitDemo} />}
        <footer className="app-footer"><span>Adaptive MVP 0.2</span><span>GitHub Pages · Supabase · Gemini · Pyodide</span><span>Пять предметов</span></footer>
      </main>

      {activeTutor && <AdaptiveTutorSession scenario={scenario} profile={activeProfile} user={user} isDemo={isDemo} minutes={minutes} energy={energy} onExit={() => setActiveTutor(false)} onComplete={handleTutorComplete} />}
    </div>
  );
}
