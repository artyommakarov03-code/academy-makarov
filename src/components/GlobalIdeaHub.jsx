import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  ListChecks,
  LoaderCircle,
  MessageSquarePlus,
  Send,
  Sparkles,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const emptyForm = {
  title: '',
  category: 'lesson',
  problem: '',
  proposal: '',
  expected_benefit: '',
  priority: 3
};

const categories = {
  lesson: 'Уроки и задания',
  design: 'Дизайн и навигация',
  game: 'Мини-игры и интерактив',
  content: 'Новый предмет или тема',
  accessibility: 'Доступность и удобство',
  performance: 'Скорость и ошибки',
  other: 'Другое'
};

const statusLabels = {
  new: 'Новая',
  reviewing: 'Изучается',
  planned: 'Запланирована',
  implemented: 'Реализована',
  declined: 'Не принята'
};

export default function GlobalIdeaHub() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('student');
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('create');
  const [form, setForm] = useState(emptyForm);
  const [ideas, setIdeas] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    async function applySession(session) {
      const nextUser = session?.user || null;
      if (!mounted) return;
      setUser(nextUser);
      if (!nextUser) {
        setRole('student');
        setOpen(false);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', nextUser.id)
        .maybeSingle();
      if (mounted) setRole(data?.role || 'student');
    }

    supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => applySession(session));
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function loadIdeas() {
    if (!user) return;
    setLoadingIdeas(true);
    const { data, error } = await supabase
      .from('site_ideas')
      .select('id,user_id,title,category,problem,proposal,expected_benefit,priority,status,created_at')
      .order('created_at', { ascending: false })
      .limit(role === 'owner' ? 100 : 30);
    setLoadingIdeas(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setIdeas(data || []);
  }

  useEffect(() => {
    if (open && tab === 'list') loadIdeas();
  }, [open, tab, user, role]);

  const canSubmit = useMemo(() => (
    form.title.trim().length >= 5
    && form.problem.trim().length >= 10
    && form.proposal.trim().length >= 10
  ), [form]);

  async function submitIdea(event) {
    event.preventDefault();
    if (!user || !canSubmit || busy) return;
    setBusy(true);
    setMessage('');
    const { error } = await supabase.from('site_ideas').insert({
      user_id: user.id,
      title: form.title.trim(),
      category: form.category,
      problem: form.problem.trim(),
      proposal: form.proposal.trim(),
      expected_benefit: form.expected_benefit.trim() || null,
      priority: Number(form.priority),
      metadata: {
        page: window.location.pathname,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        submitted_from: 'floating_idea_hub'
      }
    });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setForm(emptyForm);
    setMessage('Идея сохранена. Артём сможет открыть её через базу предложений.');
  }

  if (!user) return null;

  return (
    <>
      <button
        className="idea-fab"
        type="button"
        aria-label="Предложить идею"
        title="Предложить идею"
        onClick={() => setOpen(true)}
      >
        <MessageSquarePlus />
        <span>Идея</span>
      </button>

      {open && (
        <div className="idea-backdrop" onMouseDown={() => setOpen(false)}>
          <section className="idea-drawer" onMouseDown={(event) => event.stopPropagation()} aria-modal="true" role="dialog">
            <header className="idea-header">
              <div className="idea-mark"><Lightbulb /></div>
              <div>
                <span>Лаборатория улучшений</span>
                <h2>Помоги развивать «Новые Знания»</h2>
                <p>Предложения сохраняются в Supabase. Владелец видит их вместе со статусом рассмотрения.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть"><X /></button>
            </header>

            <div className="idea-tabs">
              <button className={tab === 'create' ? 'active' : ''} onClick={() => setTab('create')}>
                <Sparkles /> Новая идея
              </button>
              <button className={tab === 'list' ? 'active' : ''} onClick={() => setTab('list')}>
                <ListChecks /> {role === 'owner' ? 'Все идеи' : 'Мои идеи'}
              </button>
            </div>

            {tab === 'create' ? (
              <form className="idea-form" onSubmit={submitIdea}>
                <div className="idea-guide">
                  <b>Как описать идею подробно</b>
                  <ol>
                    <li>Укажи, на каком экране и на каком шаге возникает проблема.</li>
                    <li>Опиши, что происходит сейчас и почему это мешает учиться.</li>
                    <li>Предложи конкретное изменение: кнопку, правило, игру, тип задания или новый сценарий.</li>
                    <li>Напиши, как проверить, что изменение действительно стало полезным.</li>
                    <li>Не ограничивайся фразой «сделайте лучше» — приведи пример ожидаемого поведения.</li>
                  </ol>
                </div>

                <label>
                  Короткое название идеи
                  <input
                    value={form.title}
                    maxLength={140}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    placeholder="Например: график прогресса по типам ошибок"
                  />
                </label>

                <div className="idea-form-row">
                  <label>
                    Категория
                    <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                      {Object.entries(categories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <label>
                    Важность: {form.priority}/5
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={form.priority}
                      onChange={(event) => setForm({ ...form, priority: Number(event.target.value) })}
                    />
                  </label>
                </div>

                <label>
                  Что сейчас неудобно или чего не хватает?
                  <textarea
                    value={form.problem}
                    maxLength={3000}
                    onChange={(event) => setForm({ ...form, problem: event.target.value })}
                    placeholder="Опиши ситуацию, последовательность действий и конкретную трудность…"
                  />
                </label>

                <label>
                  Как именно это улучшить?
                  <textarea
                    value={form.proposal}
                    maxLength={5000}
                    onChange={(event) => setForm({ ...form, proposal: event.target.value })}
                    placeholder="Предложи интерфейс, механику или правило. Добавь пример того, что должен увидеть пользователь…"
                  />
                </label>

                <label>
                  Какой результат ожидается?
                  <textarea
                    value={form.expected_benefit}
                    maxLength={3000}
                    onChange={(event) => setForm({ ...form, expected_benefit: event.target.value })}
                    placeholder="Например: меньше случайных ошибок, понятнее прогресс, больше мотивации завершать урок…"
                  />
                </label>

                <button className="primary idea-submit" type="submit" disabled={!canSubmit || busy}>
                  {busy ? <LoaderCircle className="spin" /> : <Send />}
                  {busy ? 'Сохраняю…' : 'Сохранить идею'}
                </button>
                {message && <div className="idea-message"><CheckCircle2 /> {message}</div>}
              </form>
            ) : (
              <div className="idea-list">
                {loadingIdeas ? (
                  <div className="idea-empty"><LoaderCircle className="spin" /> Загружаю предложения…</div>
                ) : ideas.length ? ideas.map((idea) => (
                  <article key={idea.id} className={`idea-row status-${idea.status}`}>
                    <div>
                      <span>{categories[idea.category] || idea.category} · важность {idea.priority}/5</span>
                      <h3>{idea.title}</h3>
                      <p>{idea.proposal}</p>
                      <small>{new Date(idea.created_at).toLocaleString('ru-RU')}</small>
                    </div>
                    <b>{statusLabels[idea.status] || idea.status}<ChevronRight /></b>
                  </article>
                )) : (
                  <div className="idea-empty"><Lightbulb /><h3>Предложений пока нет</h3><p>Первая подробная идея появится здесь после сохранения.</p></div>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
