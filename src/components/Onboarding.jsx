import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Brain, CalendarDays, Check, Clock3, Target, UserRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

const subjects = [
  ['programming', 'Программирование'],
  ['english', 'Английский'],
  ['math', 'Математика'],
  ['cognition', 'Когнитивные навыки'],
  ['psychology', 'Психология'],
  ['income', 'Доход и проекты'],
  ['health', 'Здоровье']
];

export default function Onboarding({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    display_name: '',
    age_range: '18-25',
    primary_goal: '',
    learning_goals: ['programming'],
    programming_level: 0,
    weekly_hours: 5,
    preferred_session_minutes: 30,
    schedule_type: 'regular',
    schedule_details: '',
    energy_pattern: 'variable',
    constraints_text: '',
    explanation: 'balanced',
    practice: 'guided'
  });

  const canContinue = useMemo(() => {
    if (step === 0) return form.display_name.trim() && form.primary_goal.trim();
    if (step === 1) return form.learning_goals.length > 0;
    if (step === 2) return form.schedule_details.trim();
    return true;
  }, [form, step]);

  function patch(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function toggleGoal(slug) {
    setForm((current) => ({
      ...current,
      learning_goals: current.learning_goals.includes(slug)
        ? current.learning_goals.filter((item) => item !== slug)
        : [...current.learning_goals, slug]
    }));
  }

  async function finish() {
    setBusy(true);
    setError('');
    const constraints = form.constraints_text
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const profile = {
      user_id: user.id,
      display_name: form.display_name.trim(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      work_context: form.schedule_details.trim(),
      goals: form.learning_goals,
      role: 'student',
      onboarding_completed: true,
      age_range: form.age_range,
      primary_goal: form.primary_goal.trim(),
      learning_goals: form.learning_goals,
      subject_levels: { programming: Number(form.programming_level) },
      weekly_hours: Number(form.weekly_hours),
      preferred_session_minutes: Number(form.preferred_session_minutes),
      schedule_type: form.schedule_type,
      schedule_details: form.schedule_details.trim(),
      energy_pattern: form.energy_pattern,
      constraints,
      learning_preferences: {
        explanation: form.explanation,
        practice: form.practice
      },
      teacher_mode: true,
      profile_version: 2,
      updated_at: new Date().toISOString()
    };

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profile, { onConflict: 'user_id' });
      if (profileError) throw profileError;

      const plan = {
        horizon_days: 14,
        focus: form.learning_goals,
        weekly_hours: Number(form.weekly_hours),
        session_minutes: Number(form.preferred_session_minutes),
        first_goal: 'Освоить переменные и последовательное выполнение Python',
        rules: [
          'Начинать занятие с короткой диагностики.',
          'Не переходить дальше без самостоятельной задачи.',
          'Снижать нагрузку при низкой энергии.',
          'Возвращать ошибки в интервальное повторение.'
        ]
      };
      const { error: planError } = await supabase.from('learning_plans').insert({
        user_id: user.id,
        title: 'Персональный план на 14 дней',
        status: 'active',
        plan
      });
      if (planError) throw planError;
      onComplete(profile);
    } catch (requestError) {
      setError(requestError?.message || 'Не удалось сохранить анкету.');
    } finally {
      setBusy(false);
    }
  }

  const steps = [
    { icon: UserRound, label: 'О вас' },
    { icon: Target, label: 'Цели и уровень' },
    { icon: CalendarDays, label: 'Расписание' },
    { icon: Brain, label: 'Формат обучения' }
  ];

  return (
    <main className="onboarding-page">
      <section className="onboarding-shell">
        <aside className="onboarding-side">
          <div className="brand-lockup compact">
            <div className="brand-symbol">АМ</div>
            <div><b>Академия Макарова</b><span>Первичная настройка</span></div>
          </div>
          <h1>Сначала Академия должна понять вашу реальную жизнь.</h1>
          <p>Ответы определят длительность занятий, темп объяснений и начальный маршрут.</p>
          <div className="onboarding-steps">
            {steps.map(({ icon: Icon, label }, index) => (
              <div key={label} className={index === step ? 'active' : index < step ? 'done' : ''}>
                <span>{index < step ? <Check /> : <Icon />}</span><b>{label}</b>
              </div>
            ))}
          </div>
        </aside>

        <section className="onboarding-form">
          <div className="step-counter">Шаг {step + 1} из {steps.length}</div>

          {step === 0 && (
            <div className="form-step">
              <h2>Кто будет учиться?</h2>
              <p>Нам нужны только данные, влияющие на обучение.</p>
              <label>Как к вам обращаться?<input value={form.display_name} onChange={(event) => patch('display_name', event.target.value)} placeholder="Имя" /></label>
              <label>Возрастная группа<select value={form.age_range} onChange={(event) => patch('age_range', event.target.value)}><option value="under-18">До 18</option><option value="18-25">18–25</option><option value="26-35">26–35</option><option value="36-50">36–50</option><option value="50+">50+</option></select></label>
              <label>Главная цель<textarea value={form.primary_goal} onChange={(event) => patch('primary_goal', event.target.value)} placeholder="Например: освоить Python и получить первый доход на фрилансе" /></label>
            </div>
          )}

          {step === 1 && (
            <div className="form-step">
              <h2>Что и с какой базы изучать?</h2>
              <p>Можно выбрать несколько направлений. Первый MVP начнёт с Python.</p>
              <div className="choice-grid">
                {subjects.map(([slug, label]) => <button key={slug} className={form.learning_goals.includes(slug) ? 'selected' : ''} onClick={() => toggleGoal(slug)}>{form.learning_goals.includes(slug) && <Check />}{label}</button>)}
              </div>
              <label>Текущий уровень программирования: <b>{form.programming_level}/10</b><input type="range" min="0" max="10" value={form.programming_level} onChange={(event) => patch('programming_level', event.target.value)} /></label>
            </div>
          )}

          {step === 2 && (
            <div className="form-step">
              <h2>Когда обучение реально помещается в жизнь?</h2>
              <label>Тип расписания<select value={form.schedule_type} onChange={(event) => patch('schedule_type', event.target.value)}><option value="regular">Регулярное</option><option value="irregular_shift">Сменное / нерегулярное</option><option value="student">Учёба по расписанию</option><option value="caregiver">Зависит от семьи и обязанностей</option><option value="flexible">Свободный график</option></select></label>
              <label>Опишите обычную неделю<textarea value={form.schedule_details} onChange={(event) => patch('schedule_details', event.target.value)} placeholder="Работаю 5/2, свободен вечером; либо график меняется после смен…" /></label>
              <div className="two-columns">
                <label>Часов в неделю<input type="number" min="1" max="40" value={form.weekly_hours} onChange={(event) => patch('weekly_hours', event.target.value)} /></label>
                <label>Обычное занятие<select value={form.preferred_session_minutes} onChange={(event) => patch('preferred_session_minutes', event.target.value)}><option value="15">15 минут</option><option value="30">30 минут</option><option value="45">45 минут</option><option value="60">60 минут</option><option value="90">90 минут</option></select></label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-step">
              <h2>Как преподаватель должен вести занятие?</h2>
              <label>Энергия в течение недели<select value={form.energy_pattern} onChange={(event) => patch('energy_pattern', event.target.value)}><option value="stable">Обычно стабильная</option><option value="variable">Сильно меняется</option><option value="low_weekdays">Ниже в рабочие дни</option><option value="high_evening">Лучше вечером</option><option value="high_morning">Лучше утром</option></select></label>
              <label>Стиль объяснения<select value={form.explanation} onChange={(event) => patch('explanation', event.target.value)}><option value="concise">Кратко и по делу</option><option value="balanced">Баланс объяснения и практики</option><option value="detailed">Подробно, с несколькими примерами</option></select></label>
              <label>Стиль практики<select value={form.practice} onChange={(event) => patch('practice', event.target.value)}><option value="guided">Сначала вместе, затем самостоятельно</option><option value="practical">Через жизненные задачи</option><option value="challenge">Больше самостоятельных вызовов</option></select></label>
              <label>Ограничения, через запятую<textarea value={form.constraints_text} onChange={(event) => patch('constraints_text', event.target.value)} placeholder="Нестабильный интернет, усталость после смен, только телефон…" /></label>
            </div>
          )}

          {error && <div className="form-message error">{error}</div>}
          <div className="onboarding-actions">
            <button className="secondary" disabled={step === 0 || busy} onClick={() => setStep((value) => value - 1)}><ArrowLeft /> Назад</button>
            {step < steps.length - 1 ? (
              <button className="primary" disabled={!canContinue} onClick={() => setStep((value) => value + 1)}>Продолжить <ArrowRight /></button>
            ) : (
              <button className="primary" disabled={busy} onClick={finish}>{busy ? 'Создаю план…' : 'Создать мой план'} <Clock3 /></button>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
