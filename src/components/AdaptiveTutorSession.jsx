import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  CircleAlert,
  Clock3,
  Code2,
  Gauge,
  Lightbulb,
  LoaderCircle,
  Play,
  Send,
  Sparkles,
  UserRound,
  Wifi,
  WifiOff,
  X
} from 'lucide-react';
import { runPython } from '../lib/pythonRunner';
import { requestTutorReply } from '../lib/tutorAi';
import { supabase } from '../lib/supabase';
import { buildAdaptivePlan } from '../data/subjectScenarios';

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));
const normalize = (value) => String(value ?? '')
  .trim()
  .toLowerCase()
  .replace(/[.,!?;:"'«»]/g, '')
  .replace(/\s+/g, ' ');

function checkAnswer(task, answer) {
  const raw = String(answer ?? '').trim();
  const candidate = normalize(raw);

  if (task.type === 'choice') return candidate === normalize(task.correctOption);

  if (typeof task.numeric === 'number') {
    const match = raw.replace(',', '.').match(/-?\d+(?:\.\d+)?/);
    if (!match) return false;
    return Math.abs(Number(match[0]) - task.numeric) <= Number(task.tolerance || 0);
  }

  if (Array.isArray(task.accepted) && task.accepted.some((item) => normalize(item) === candidate)) return true;
  if (Array.isArray(task.allKeywords) && task.allKeywords.every((item) => candidate.includes(normalize(item)))) return true;
  if (Array.isArray(task.anyKeywords) && task.anyKeywords.some((item) => candidate.includes(normalize(item)))) return true;
  return false;
}

function compactForbidden(task) {
  return [
    ...(task.accepted || []),
    task.correctOption || '',
    typeof task.numeric === 'number' ? String(task.numeric) : ''
  ].filter(Boolean).slice(0, 10);
}

export default function AdaptiveTutorSession({ scenario, profile, user, isDemo, minutes, energy, onExit, onComplete }) {
  const plan = useMemo(() => buildAdaptivePlan(scenario, minutes, energy), [scenario, minutes, energy]);
  const aiEnabled = Boolean(user) && !isDemo;
  const [taskIndex, setTaskIndex] = useState(0);
  const [messages, setMessages] = useState([]);
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [code, setCode] = useState(plan.tasks[0]?.starter || '');
  const [runResult, setRunResult] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);
  const [summary, setSummary] = useState(null);
  const [aiStatus, setAiStatus] = useState(aiEnabled ? 'connecting' : 'scenario');
  const [aiModel, setAiModel] = useState('');

  const sessionId = useRef(null);
  const messageEnd = useRef(null);
  const messagesRef = useRef([]);
  const attemptsRef = useRef({});
  const hintsRef = useRef({});
  const resultsRef = useRef({});
  const startedAt = useRef(Date.now());
  const completedRef = useRef(false);

  const currentTask = plan.tasks[taskIndex];
  const completedCount = Object.values(resultsRef.current).filter(Boolean).length;
  const progress = summary ? 100 : Math.round((taskIndex / plan.tasks.length) * 100);

  useEffect(() => {
    messageEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      if (!isDemo && user) {
        const { data, error } = await supabase
          .from('tutor_sessions')
          .insert({
            user_id: user.id,
            course_id: null,
            lesson_id: null,
            scenario_slug: scenario.slug,
            status: 'active',
            mode: 'adaptive_ai',
            planned_minutes: minutes,
            energy,
            profile_snapshot: {
              subject: scenario.subject,
              level: profile.subject_levels?.[scenario.subject] || 0,
              schedule_type: profile.schedule_type,
              preferred_session_minutes: profile.preferred_session_minutes
            },
            state: {
              subject: scenario.subject,
              task_ids: plan.tasks.map((task) => task.id),
              task_count: plan.targetCount,
              max_difficulty: plan.maxDifficulty,
              phase: 'active'
            }
          })
          .select('id')
          .single();
        if (!error) sessionId.current = data.id;
      }

      if (cancelled) return;
      setReady(true);
      const welcome = `${profile.display_name || 'Ученик'}, сегодня выбран предмет «${scenario.title}». За ${minutes} минут план включает ${plan.targetCount} задач; режим — ${plan.mode.toLowerCase()}. ${plan.explanationStyle}.`;
      await tutorSay(welcome, { kind: 'welcome' }, {
        mode: 'welcome',
        topic: scenario.title,
        phase: 'start',
        deterministicFeedback: welcome,
        revealSolutionAllowed: false
      });
      await tutorSay(scenario.definition.promise, { kind: 'promise' });
      await tutorSay(plan.tasks[0].prompt, { kind: 'question', taskId: plan.tasks[0].id });
      await logEvent('adaptive_session_started', {
        subject: scenario.subject,
        minutes,
        energy,
        task_count: plan.targetCount,
        max_difficulty: plan.maxDifficulty,
        task_ids: plan.tasks.map((task) => task.id)
      });
    }

    initialize();
    return () => { cancelled = true; };
  }, []);

  function appendMessage(message) {
    messagesRef.current = [...messagesRef.current, message];
    setMessages(messagesRef.current);
  }

  async function persistMessage(role, content, metadata = {}) {
    if (isDemo || !user || !sessionId.current) return;
    await supabase.from('tutor_messages').insert({
      session_id: sessionId.current,
      user_id: user.id,
      role,
      content,
      metadata
    });
  }

  async function logEvent(eventType, payload = {}) {
    if (isDemo || !user) return;
    await supabase.from('tutor_events').insert({
      session_id: sessionId.current,
      user_id: user.id,
      event_type: eventType,
      payload
    });
  }

  async function tutorSay(fallbackContent, metadata = {}, aiRequest = null) {
    setThinking(true);
    let content = fallbackContent;
    let aiMetadata = { provider: 'scenario', fallback: true };

    if (aiRequest) {
      const reply = await requestTutorReply({
        enabled: aiEnabled,
        fallbackMessage: fallbackContent,
        subject: scenario.subject,
        topic: aiRequest.topic || scenario.title,
        phase: aiRequest.phase || `task_${taskIndex + 1}`,
        mode: aiRequest.mode || 'explain',
        objectiveVerdict: aiRequest.objectiveVerdict,
        studentAnswer: aiRequest.studentAnswer,
        question: aiRequest.question,
        deterministicFeedback: aiRequest.deterministicFeedback || fallbackContent,
        deterministicHint: aiRequest.deterministicHint,
        codeError: aiRequest.codeError,
        failedTests: aiRequest.failedTests || [],
        hintLevel: aiRequest.hintLevel || 0,
        attempt: aiRequest.attempt || 1,
        energy,
        availableMinutes: minutes,
        profile,
        messages: messagesRef.current,
        revealSolutionAllowed: aiRequest.revealSolutionAllowed === true,
        forbiddenFragments: aiRequest.forbiddenFragments || []
      });

      content = reply.message || fallbackContent;
      aiMetadata = {
        provider: reply.provider || 'scenario',
        model: reply.model || null,
        fallback: reply.fallback !== false,
        reason: reply.reason || null,
        action: reply.action || null
      };

      if (reply.enabled && !reply.fallback) {
        setAiStatus('online');
        setAiModel(reply.model || 'Gemini');
        logEvent('ai_reply_generated', {
          subject: scenario.subject,
          task_id: currentTask?.id,
          provider: reply.provider,
          model: reply.model,
          action: reply.action
        });
      } else if (aiEnabled) {
        setAiStatus(reply.reason === 'AI_NOT_CONFIGURED' ? 'needs_key' : 'fallback');
        logEvent('ai_fallback_used', { subject: scenario.subject, task_id: currentTask?.id, reason: reply.reason || 'UNKNOWN' });
      }
    }

    if (energy <= 3 && content.length > 420) content = `${content.slice(0, 417)}…`;
    await sleep(metadata.instant ? 0 : 300);
    const message = {
      id: crypto.randomUUID(),
      role: 'tutor',
      content,
      metadata: { ...metadata, ai: aiMetadata }
    };
    appendMessage(message);
    setThinking(false);
    persistMessage('teacher', content, message.metadata);
  }

  function studentSay(content, metadata = {}) {
    const message = { id: crypto.randomUUID(), role: 'student', content, metadata };
    appendMessage(message);
    persistMessage('student', content, metadata);
  }

  async function submitCurrentAnswer() {
    if (!currentTask || thinking || running) return;
    if (currentTask.type === 'code') {
      await executeCode();
      return;
    }

    const value = currentTask.type === 'choice' ? selectedOption : answer.trim();
    if (!value) return;
    setAnswer('');
    setSelectedOption('');
    studentSay(value, { task_id: currentTask.id, kind: currentTask.type });
    const attempt = (attemptsRef.current[currentTask.id] || 0) + 1;
    attemptsRef.current[currentTask.id] = attempt;
    const correct = checkAnswer(currentTask, value);
    await handleCheckedAnswer(correct, value, attempt);
  }

  async function executeCode() {
    if (!code.trim() || running || thinking) return;
    setRunning(true);
    setRunResult(null);
    const attempt = (attemptsRef.current[currentTask.id] || 0) + 1;
    attemptsRef.current[currentTask.id] = attempt;
    studentSay(code, { task_id: currentTask.id, kind: 'code' });
    await logEvent('code_run', { task_id: currentTask.id, attempt, code_length: code.length });
    const result = await runPython(code, currentTask.tests || []);
    setRunResult(result);
    setRunning(false);
    const correct = !result.error && result.tests.length > 0 && result.tests.every((test) => test.passed);
    const failedTests = result.tests.filter((test) => !test.passed).map((test) => test.name);
    await handleCheckedAnswer(correct, code, attempt, result.error, failedTests);
  }

  async function handleCheckedAnswer(correct, value, attempt, codeError = '', failedTests = []) {
    resultsRef.current[currentTask.id] = correct;
    await logEvent('adaptive_answer_checked', {
      subject: scenario.subject,
      task_id: currentTask.id,
      difficulty: currentTask.difficulty,
      correct,
      attempt,
      hints_used: hintsRef.current[currentTask.id] || 0
    });

    if (!correct) {
      const fallback = codeError
        ? `Python остановил программу с ошибкой. Найди первую строку, где программа перестаёт соответствовать условию, и исправь только её.`
        : attempt === 1
          ? 'Ответ пока не проходит проверку. Вернись к точной формулировке условия и проверь первый шаг рассуждения.'
          : 'Та же ошибка повторилась. Смени стратегию: выпиши данные, ограничение и то, что требуется найти.';
      await tutorSay(fallback, { kind: 'feedback', taskId: currentTask.id }, {
        mode: attempt === 1 ? 'explain' : 'hint',
        topic: currentTask.prompt,
        phase: `task_${taskIndex + 1}`,
        objectiveVerdict: false,
        studentAnswer: value,
        question: currentTask.prompt,
        deterministicFeedback: fallback,
        codeError,
        failedTests,
        attempt,
        revealSolutionAllowed: false,
        forbiddenFragments: compactForbidden(currentTask)
      });
      return;
    }

    const fallback = currentTask.explanation || 'Верно. Важен не только ответ, но и способ, который можно перенести на следующую задачу.';
    await tutorSay(fallback, { kind: 'success', taskId: currentTask.id }, {
      mode: 'explain',
      topic: currentTask.prompt,
      phase: `task_${taskIndex + 1}`,
      objectiveVerdict: true,
      studentAnswer: value,
      question: currentTask.prompt,
      deterministicFeedback: fallback,
      attempt,
      revealSolutionAllowed: true
    });
    await advanceTask();
  }

  async function showHint() {
    if (!currentTask || thinking || running) return;
    const hints = currentTask.hints || [];
    if (!hints.length) return;
    const used = hintsRef.current[currentTask.id] || 0;
    const index = Math.min(used, hints.length - 1);
    const hint = hints[index];
    hintsRef.current[currentTask.id] = used + 1;
    await logEvent('adaptive_hint_used', { task_id: currentTask.id, level: index + 1 });
    await tutorSay(`Подсказка ${index + 1}: ${hint}`, { kind: 'hint', taskId: currentTask.id }, {
      mode: 'hint',
      topic: currentTask.prompt,
      phase: `task_${taskIndex + 1}`,
      deterministicHint: hint,
      deterministicFeedback: `Подсказка ${index + 1}: ${hint}`,
      hintLevel: index + 1,
      attempt: attemptsRef.current[currentTask.id] || 1,
      revealSolutionAllowed: index === hints.length - 1,
      forbiddenFragments: index === hints.length - 1 ? [] : compactForbidden(currentTask)
    });
  }

  async function advanceTask() {
    if (taskIndex >= plan.tasks.length - 1) {
      await completeSession();
      return;
    }
    const nextIndex = taskIndex + 1;
    const nextTask = plan.tasks[nextIndex];
    setTaskIndex(nextIndex);
    setCode(nextTask.starter || '');
    setRunResult(null);
    setAnswer('');
    setSelectedOption('');
    await tutorSay(nextTask.prompt, { kind: 'question', taskId: nextTask.id });
  }

  function buildSummary() {
    const skillRows = scenario.definition.skills.map((skill) => {
      const tasks = plan.tasks.filter((task) => task.skill === skill.slug);
      const scores = tasks.map((task) => {
        if (!resultsRef.current[task.id]) return 0;
        const attempts = attemptsRef.current[task.id] || 1;
        const hints = hintsRef.current[task.id] || 0;
        return clamp(100 - (attempts - 1) * 15 - hints * 12 + (task.difficulty >= 4 ? 5 : 0));
      });
      const measured = scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : skill.baseline;
      return { ...skill, value: Math.max(skill.baseline, measured) };
    });
    const after = Object.fromEntries(skillRows.map((skill) => [skill.slug, skill.value]));
    const overall = Math.round(skillRows.reduce((sum, skill) => sum + skill.value, 0) / skillRows.length);
    const totalHints = Object.values(hintsRef.current).reduce((sum, value) => sum + value, 0);
    const totalAttempts = Object.values(attemptsRef.current).reduce((sum, value) => sum + value, 0);
    const correctTasks = plan.tasks.filter((task) => resultsRef.current[task.id]).length;
    return {
      subject: scenario.subject,
      scenarioSlug: scenario.slug,
      before: Object.fromEntries(scenario.definition.skills.map((skill) => [skill.slug, skill.baseline])),
      after,
      overall,
      correctTasks,
      taskCount: plan.tasks.length,
      totalHints,
      totalAttempts,
      maxDifficulty: plan.maxDifficulty,
      plannedMinutes: minutes,
      energy,
      durationMinutes: Math.max(1, Math.round((Date.now() - startedAt.current) / 60000)),
      independent: correctTasks === plan.tasks.length && totalHints === 0,
      aiProvider: aiStatus === 'online' ? 'gemini' : 'scenario',
      aiModel: aiModel || null,
      nextAction: overall >= 80
        ? 'Через 3 дня — короткое воспроизведение без подсказок и новый перенос.'
        : 'На следующем занятии — повтор ошибок другим способом и более короткая независимая проверка.'
    };
  }

  async function completeSession() {
    if (completedRef.current) return;
    completedRef.current = true;
    const finalSummary = buildSummary();
    setSummary(finalSummary);

    if (!isDemo && user && sessionId.current) {
      await supabase
        .from('tutor_sessions')
        .update({
          status: 'completed',
          state: {
            subject: scenario.subject,
            phase: 'summary',
            attempts: attemptsRef.current,
            hints: hintsRef.current,
            results: resultsRef.current,
            ai_status: aiStatus
          },
          result: finalSummary,
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId.current);

      const reviewDate = new Date();
      reviewDate.setDate(reviewDate.getDate() + (finalSummary.overall >= 80 ? 3 : 1));
      const rows = scenario.definition.skills.map((skill) => ({
        user_id: user.id,
        skill_slug: skill.slug,
        skill_title: skill.title,
        mastery: finalSummary.after[skill.slug],
        attempts: finalSummary.totalAttempts,
        independent_successes: finalSummary.independent ? 1 : 0,
        hints_used: finalSummary.totalHints,
        evidence: [{ session_id: sessionId.current, scenario: scenario.slug, result: finalSummary }],
        next_review_at: reviewDate.toISOString(),
        updated_at: new Date().toISOString()
      }));
      await supabase.from('skill_mastery').upsert(rows, { onConflict: 'user_id,skill_slug' });
      await logEvent('adaptive_session_completed', finalSummary);
    }

    const completion = `Занятие завершено: ${finalSummary.correctTasks} из ${finalSummary.taskCount} задач, итоговое освоение ${finalSummary.overall}%. ${finalSummary.nextAction}`;
    await tutorSay(completion, { kind: 'summary' }, {
      mode: 'summarize',
      topic: scenario.title,
      phase: 'summary',
      deterministicFeedback: completion,
      revealSolutionAllowed: true
    });
    onComplete(finalSummary);
  }

  async function leaveSession() {
    if (!completedRef.current && !isDemo && user && sessionId.current) {
      await supabase
        .from('tutor_sessions')
        .update({
          status: 'abandoned',
          ended_at: new Date().toISOString(),
          state: {
            subject: scenario.subject,
            task_index: taskIndex,
            attempts: attemptsRef.current,
            hints: hintsRef.current,
            results: resultsRef.current,
            ai_status: aiStatus
          }
        })
        .eq('id', sessionId.current);
    }
    onExit();
  }

  const aiLabel = aiStatus === 'online'
    ? 'ИИ Gemini активен'
    : aiStatus === 'connecting'
      ? 'Подключаю ИИ'
      : aiStatus === 'needs_key'
        ? 'Нужен ключ Gemini'
        : aiStatus === 'fallback'
          ? 'Сценарный резерв'
          : 'Демо без внешнего ИИ';

  if (!ready) return <div className="full-loader"><LoaderCircle className="spin" /> Подготавливаю адаптивный урок…</div>;

  return (
    <div className="adaptive-overlay">
      <div className="adaptive-room">
        <header className="adaptive-header">
          <button className="icon-button" onClick={leaveSession}><ChevronLeft /></button>
          <div className="adaptive-title"><div className="tutor-avatar"><Bot /></div><div><span>Преподаватель Академии</span><b>{scenario.title}</b></div></div>
          <div className="adaptive-status">
            <span className={`ai-state ${aiStatus}`}>{aiStatus === 'online' ? <Wifi /> : <WifiOff />}{aiLabel}</span>
            <span><Clock3 /> {minutes} мин</span>
            <span><Gauge /> {plan.mode}</span>
          </div>
          <button className="icon-button" onClick={leaveSession}><X /></button>
        </header>

        <div className="adaptive-progress">
          <div><span>{summary ? 'Итог' : `Задача ${taskIndex + 1} из ${plan.tasks.length}`}</span><b>{progress}%</b></div>
          <div className="adaptive-progress-track"><i style={{ width: `${progress}%` }} /></div>
          <small>Сложность до {plan.maxDifficulty}/5 · энергия {energy}/10 · выполнено {completedCount}</small>
        </div>

        <div className="adaptive-body">
          <section className="adaptive-dialogue">
            <div className="conversation-head"><div><span>Диалог</span><b>Один шаг за раз</b></div><div className="context-chip">{plan.explanationStyle}</div></div>
            <div className="messages">
              {messages.map((message) => (
                <article key={message.id} className={`message ${message.role} ${message.metadata?.kind || ''}`}>
                  <div className="message-avatar">{message.role === 'tutor' ? <Bot /> : <UserRound />}</div>
                  <div><span>{message.role === 'tutor' ? 'Преподаватель' : profile.display_name || 'Ученик'}{message.role === 'tutor' && message.metadata?.ai?.provider === 'gemini' ? ' · ИИ' : ''}</span><p>{message.content}</p></div>
                </article>
              ))}
              {thinking && <article className="message tutor thinking"><div className="message-avatar"><Bot /></div><div><span>Преподаватель анализирует</span><p><i /><i /><i /></p></div></article>}
              <div ref={messageEnd} />
            </div>
          </section>

          <aside className="adaptive-workspace">
            {!summary && currentTask && (
              <div className="adaptive-task-card">
                <div className="task-meta"><span><BrainCircuit /> Навык: {scenario.definition.skills.find((skill) => skill.slug === currentTask.skill)?.title}</span><b>Сложность {currentTask.difficulty}/5</b></div>
                <h2>{currentTask.prompt}</h2>

                {currentTask.type === 'choice' && (
                  <div className="choice-grid">
                    {currentTask.options.map((option) => <button key={option} className={selectedOption === option ? 'selected' : ''} onClick={() => setSelectedOption(option)}>{option}</button>)}
                  </div>
                )}

                {currentTask.type === 'text' && (
                  <textarea className="adaptive-answer" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Напиши ответ или ход рассуждения…" />
                )}

                {currentTask.type === 'code' && (
                  <div className="adaptive-code">
                    <div className="editor-label"><span>main.py</span><b><Code2 /> Python в браузере</b></div>
                    <textarea className="code-editor" value={code} onChange={(event) => { setCode(event.target.value); setRunResult(null); }} spellCheck="false" />
                    {runResult && <div className="run-report"><div className="output-box"><span>Вывод программы</span><pre>{runResult.error || runResult.output || 'Программа ничего не вывела.'}</pre></div><div className="test-list"><div><b>Проверки</b><span>{runResult.tests.filter((test) => test.passed).length}/{runResult.tests.length}</span></div>{runResult.tests.map((test) => <article key={test.name} className={test.passed ? 'passed' : 'failed'}>{test.passed ? <CheckCircle2 /> : <CircleAlert />}<span>{test.name}</span></article>)}</div></div>}
                  </div>
                )}

                <div className="adaptive-actions">
                  <button className="secondary" disabled={thinking || running} onClick={showHint}><Lightbulb /> Подсказка {(hintsRef.current[currentTask.id] || 0) > 0 ? `(${hintsRef.current[currentTask.id]})` : ''}</button>
                  <button className="primary" disabled={thinking || running || (currentTask.type === 'text' ? !answer.trim() : currentTask.type === 'choice' ? !selectedOption : !code.trim())} onClick={submitCurrentAnswer}>
                    {currentTask.type === 'code' ? (running ? <LoaderCircle className="spin" /> : <Play />) : <Send />}
                    {currentTask.type === 'code' ? (running ? 'Запускаю…' : 'Запустить и проверить') : 'Проверить ответ'}
                  </button>
                </div>
              </div>
            )}

            {summary && (
              <div className="adaptive-summary">
                <div className="summary-score"><span>Доказанное освоение</span><b>{summary.overall}%</b><p>{summary.correctTasks} из {summary.taskCount} задач пройдено · максимум сложности {summary.maxDifficulty}/5</p></div>
                <div className="skill-growth">
                  {scenario.definition.skills.map((skill) => <article key={skill.slug}><div><b>{skill.title}</b><span>{summary.before[skill.slug]}% → {summary.after[skill.slug]}%</span></div><div className="growth-track"><i className="before" style={{ width: `${summary.before[skill.slug]}%` }} /><i className="after" style={{ width: `${summary.after[skill.slug]}%` }} /></div></article>)}
                </div>
                <div className="evidence-grid"><article><b>{summary.durationMinutes} мин</b><span>длительность</span></article><article><b>{summary.totalHints}</b><span>подсказок</span></article><article><b>{summary.totalAttempts}</b><span>попыток</span></article></div>
                <div className="next-action"><Sparkles /><div><b>Следующий шаг</b><p>{summary.nextAction}</p></div></div>
                <button className="primary wide" onClick={leaveSession}>Вернуться в Академию <ArrowRight /></button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
