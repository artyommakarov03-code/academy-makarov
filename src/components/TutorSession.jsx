import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronLeft,
  CircleAlert,
  Clock3,
  Code2,
  Gauge,
  Lightbulb,
  LoaderCircle,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  UserRound,
  X
} from 'lucide-react';
import { runPython } from '../lib/pythonRunner';
import { supabase } from '../lib/supabase';

const phaseOrder = ['diagnostic', 'guided', 'code', 'transfer', 'summary'];
const phaseLabels = {
  diagnostic: 'Диагностика',
  guided: 'Совместное решение',
  code: 'Практика с проверкой',
  transfer: 'Самостоятельная задача',
  summary: 'Результат'
};

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const normalize = (value) => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));

export default function TutorSession({ scenario, profile, user, isDemo, minutes, energy, onExit, onComplete }) {
  const definition = scenario.definition;
  const [phase, setPhase] = useState('diagnostic');
  const [messages, setMessages] = useState([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [code, setCode] = useState(definition.code_task.starter);
  const [runResult, setRunResult] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);
  const [attempts, setAttempts] = useState({ diagnostic: 0, guided: 0, code: 0, transfer: 0 });
  const [results, setResults] = useState({ diagnostic: false, guided: false, code: false, transfer: false });
  const [hints, setHints] = useState({ guided: 0, code: 0, transfer: 0 });
  const [summary, setSummary] = useState(null);
  const sessionId = useRef(null);
  const messageEnd = useRef(null);
  const startedAt = useRef(Date.now());
  const completedRef = useRef(false);

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
            course_id: definition.course_id,
            lesson_id: definition.lesson_id,
            scenario_slug: scenario.slug,
            status: 'active',
            mode: 'guided',
            planned_minutes: minutes,
            energy,
            profile_snapshot: profile,
            state: { phase: 'diagnostic', attempts: {}, hints: {} }
          })
          .select('id')
          .single();
        if (!error) sessionId.current = data.id;
      }
      if (cancelled) return;
      setReady(true);
      await tutorSay(
        `Привет, ${profile.display_name || 'ученик'}. Сегодня у нас ${minutes} минут, энергия ${energy}/10. Я буду давать по одному шагу и не перейду дальше, пока не станет понятно, что именно ты умеешь делать самостоятельно.`,
        { kind: 'welcome' }
      );
      await tutorSay(definition.promise, { kind: 'promise' });
      await tutorSay(definition.diagnostic.question, { kind: 'question', phase: 'diagnostic' });
      await logEvent('session_started', { minutes, energy, demo: isDemo });
    }
    initialize();
    return () => {
      cancelled = true;
    };
  }, []);

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
    if (isDemo || !user || !sessionId.current) return;
    await supabase.from('tutor_events').insert({
      session_id: sessionId.current,
      user_id: user.id,
      event_type: eventType,
      payload
    });
  }

  async function tutorSay(content, metadata = {}) {
    setThinking(true);
    await sleep(metadata.instant ? 0 : 420);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'tutor', content, metadata }]);
    setThinking(false);
    persistMessage('assistant', content, metadata);
  }

  function studentSay(content, metadata = {}) {
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'student', content, metadata }]);
    persistMessage('user', content, metadata);
  }

  function answerAccepted(value, accepted) {
    const candidate = normalize(value).replace(/\s/g, '');
    return accepted.some((item) => normalize(item).replace(/\s/g, '') === candidate);
  }

  async function submitTextAnswer() {
    if (!textAnswer.trim() || thinking) return;
    const value = textAnswer.trim();
    setTextAnswer('');
    studentSay(value, { phase });

    if (phase === 'diagnostic') {
      const ok = answerAccepted(value, definition.diagnostic.accepted);
      setAttempts((current) => ({ ...current, diagnostic: current.diagnostic + 1 }));
      setResults((current) => ({ ...current, diagnostic: ok }));
      await logEvent('answer_checked', { phase, correct: ok, answer: value });
      await tutorSay(ok ? definition.diagnostic.correct : definition.diagnostic.incorrect, {
        kind: ok ? 'success' : 'feedback'
      });
      if (!ok) {
        await tutorSay(
          'Представь переменную как подписанную ячейку. Команда x = x + 3 сначала читает старое содержимое ячейки, вычисляет новое значение и только затем заменяет содержимое.',
          { kind: 'explanation' }
        );
      }
      setPhase('guided');
      await tutorSay(definition.guided.question, { kind: 'question', phase: 'guided' });
      return;
    }

    if (phase === 'guided') {
      const nextAttempt = attempts.guided + 1;
      const ok = answerAccepted(value, definition.guided.accepted);
      setAttempts((current) => ({ ...current, guided: nextAttempt }));
      await logEvent('answer_checked', { phase, correct: ok, answer: value, attempt: nextAttempt });
      if (ok) {
        setResults((current) => ({ ...current, guided: true }));
        await tutorSay(definition.guided.correct, { kind: 'success' });
        await tutorSay(
          'Теперь ты применишь тот же способ в коде: исходные данные → вычисление → вывод. Я запущу программу и проверю её тестами.',
          { kind: 'transition' }
        );
        setPhase('code');
        setCode(definition.code_task.starter);
        setRunResult(null);
        return;
      }

      await tutorSay(definition.guided.incorrect, { kind: 'feedback' });
      if (nextAttempt >= 2 && hints.guided === 0) await showHint('guided');
    }
  }

  async function showHint(target = phase) {
    const task = target === 'guided' ? definition.guided : target === 'code' ? definition.code_task : definition.transfer;
    const used = hints[target] || 0;
    const available = task.hints || [];
    if (!available.length) return;
    const index = Math.min(used, available.length - 1);
    setHints((current) => ({ ...current, [target]: Math.min(available.length, used + 1) }));
    await logEvent('hint_used', { phase: target, level: index + 1 });
    await tutorSay(`Подсказка ${index + 1}: ${available[index]}`, { kind: 'hint', phase: target });
  }

  async function executeCode() {
    if (running || !code.trim()) return;
    const task = phase === 'code' ? definition.code_task : definition.transfer;
    setRunning(true);
    setRunResult(null);
    const nextAttempt = attempts[phase] + 1;
    setAttempts((current) => ({ ...current, [phase]: nextAttempt }));
    studentSay(code, { phase, kind: 'code' });
    await logEvent('code_run', { phase, attempt: nextAttempt, code_length: code.length });

    const result = await runPython(code, task.tests);
    setRunResult(result);
    setRunning(false);
    const allPassed = !result.error && result.tests.length > 0 && result.tests.every((test) => test.passed);

    await logEvent('code_checked', {
      phase,
      correct: allPassed,
      output: result.output,
      error: result.error,
      tests: result.tests
    });

    if (!allPassed) {
      const failed = result.tests.filter((test) => !test.passed).map((test) => test.name);
      const feedback = result.error
        ? `Python остановил программу с ошибкой:\n${result.error.split('\n').slice(-3).join('\n')}`
        : `Программа запустилась, но не прошла проверки: ${failed.join('; ')}.`;
      await tutorSay(feedback, { kind: 'feedback', phase });
      await tutorSay(
        'Не переписывай всё сразу. Найди первое невыполненное условие, исправь только его и запусти программу повторно.',
        { kind: 'strategy' }
      );
      return;
    }

    setResults((current) => ({ ...current, [phase]: true }));
    if (phase === 'code') {
      await tutorSay(
        `Все ${result.tests.length} проверки пройдены. Ты написал рабочий расчёт, но сейчас важно проверить перенос — сможешь ли ты решить похожую задачу без копирования.`,
        { kind: 'success' }
      );
      setPhase('transfer');
      setCode(definition.transfer.starter);
      setRunResult(null);
      await tutorSay(definition.transfer.prompt, { kind: 'question', phase: 'transfer' });
    } else {
      await tutorSay(
        'Самостоятельная задача прошла все проверки. Это уже доказательство навыка, а не просто ощущение, что материал понятен.',
        { kind: 'success' }
      );
      setResults((current) => {
        const updated = { ...current, transfer: true };
        completeSession(updated);
        return updated;
      });
    }
  }

  function buildSummary(finalResults) {
    const totalHints = Object.values(hints).reduce((sum, value) => sum + value, 0);
    const after = {
      python_assignment: clamp(15 + (finalResults.code ? 45 : 0) + (finalResults.transfer ? 35 : 0) - totalHints * 3),
      python_execution_order: clamp(10 + (finalResults.diagnostic ? 20 : 8) + (finalResults.guided ? 25 : 8) + (finalResults.transfer ? 35 : 0) - totalHints * 2),
      python_output_prediction: clamp(5 + (finalResults.diagnostic ? 20 : 8) + (finalResults.guided ? 25 : 8) + (finalResults.code ? 20 : 0) + (finalResults.transfer ? 25 : 0) - totalHints * 2)
    };
    const overall = Math.round(Object.values(after).reduce((sum, value) => sum + value, 0) / 3);
    return {
      before: Object.fromEntries(definition.skills.map((skill) => [skill.slug, skill.baseline])),
      after,
      overall,
      totalHints,
      attempts,
      independent: finalResults.transfer && (hints.transfer || 0) === 0,
      durationMinutes: Math.max(1, Math.round((Date.now() - startedAt.current) / 60000)),
      nextAction:
        overall >= 80
          ? 'Через 3 дня — короткое повторение и новая задача на ввод данных.'
          : 'Завтра — повтор последовательного выполнения с другим примером.'
    };
  }

  async function completeSession(finalResults) {
    if (completedRef.current) return;
    completedRef.current = true;
    const finalSummary = buildSummary(finalResults);
    setSummary(finalSummary);
    setPhase('summary');

    if (!isDemo && user && sessionId.current) {
      await supabase
        .from('tutor_sessions')
        .update({
          status: 'completed',
          state: { phase: 'summary', attempts, hints, results: finalResults },
          result: finalSummary,
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId.current);

      const reviewDate = new Date();
      reviewDate.setDate(reviewDate.getDate() + (finalSummary.overall >= 80 ? 3 : 1));
      const rows = definition.skills.map((skill) => ({
        user_id: user.id,
        skill_slug: skill.slug,
        skill_title: skill.title,
        mastery: finalSummary.after[skill.slug],
        attempts: Object.values(attempts).reduce((sum, value) => sum + value, 0),
        independent_successes: finalSummary.independent ? 1 : 0,
        hints_used: finalSummary.totalHints,
        evidence: [{ session_id: sessionId.current, scenario: scenario.slug, result: finalSummary }],
        next_review_at: reviewDate.toISOString(),
        updated_at: new Date().toISOString()
      }));
      await supabase.from('skill_mastery').upsert(rows, { onConflict: 'user_id,skill_slug' });
      await logEvent('session_completed', finalSummary);
    }

    await tutorSay(
      `Занятие завершено. Итоговое освоение — ${finalSummary.overall}%. Следующий шаг выбран не по календарю, а по твоим ответам: ${finalSummary.nextAction}`,
      { kind: 'summary' }
    );
    onComplete(finalSummary);
  }

  async function leaveSession() {
    if (!completedRef.current && !isDemo && user && sessionId.current) {
      await supabase
        .from('tutor_sessions')
        .update({ status: 'abandoned', ended_at: new Date().toISOString(), state: { phase, attempts, hints, results } })
        .eq('id', sessionId.current);
    }
    onExit();
  }

  const phaseIndex = phaseOrder.indexOf(phase);
  const activeTask = phase === 'code' ? definition.code_task : phase === 'transfer' ? definition.transfer : null;
  const testPassed = runResult?.tests?.filter((test) => test.passed).length || 0;
  const currentHints = hints[phase] || 0;
  const canSubmitText = ['diagnostic', 'guided'].includes(phase);
  const sessionMode = energy <= 3 ? 'Восстановительный' : energy >= 8 ? 'Глубокий фокус' : 'Рабочий';

  const progressPercent = useMemo(() => {
    if (phase === 'summary') return 100;
    return Math.round(((phaseIndex + 0.25) / (phaseOrder.length - 1)) * 100);
  }, [phaseIndex, phase]);

  if (!ready) return <div className="full-loader"><LoaderCircle /> Подготавливаю занятие…</div>;

  return (
    <div className="tutor-overlay">
      <div className="tutor-room">
        <header className="tutor-header">
          <button className="icon-button" onClick={leaveSession}><ChevronLeft /></button>
          <div className="tutor-title"><div className="tutor-avatar"><Bot /></div><div><span>Преподаватель Академии</span><b>{scenario.title}</b></div></div>
          <div className="session-status"><span className="live-dot">В занятии</span><span><Clock3 /> {minutes} мин</span><span><Gauge /> {sessionMode}</span></div>
          <button className="icon-button" onClick={leaveSession}><X /></button>
        </header>

        <div className="phase-strip">
          {phaseOrder.map((item, index) => <div key={item} className={index < phaseIndex || phase === 'summary' ? 'done' : item === phase ? 'active' : ''}><i>{index < phaseIndex || phase === 'summary' ? <CheckCircle2 /> : index + 1}</i><span>{phaseLabels[item]}</span></div>)}
          <div className="phase-progress"><i style={{ width: `${progressPercent}%` }} /></div>
        </div>

        <div className="tutor-body">
          <section className="conversation-panel">
            <div className="conversation-head"><div><span>Диалог</span><b>Преподаватель ведёт по одному шагу</b></div><div className="context-chip">Энергия {energy}/10</div></div>
            <div className="messages">
              {messages.map((message) => (
                <article key={message.id} className={`message ${message.role} ${message.metadata?.kind || ''}`}>
                  <div className="message-avatar">{message.role === 'tutor' ? <Bot /> : <UserRound />}</div>
                  <div><span>{message.role === 'tutor' ? 'Преподаватель' : profile.display_name || 'Ученик'}</span><p>{message.content}</p></div>
                </article>
              ))}
              {thinking && <article className="message tutor thinking"><div className="message-avatar"><Bot /></div><div><span>Преподаватель анализирует</span><p><i /><i /><i /></p></div></article>}
              <div ref={messageEnd} />
            </div>

            {canSubmitText && (
              <div className="composer">
                <textarea value={textAnswer} onChange={(event) => setTextAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submitTextAnswer(); } }} placeholder="Напиши ответ и ход мысли…" />
                <div><button className="secondary" disabled={phase === 'diagnostic' || thinking} onClick={() => showHint()}><Lightbulb /> Подсказка</button><button className="primary" disabled={!textAnswer.trim() || thinking} onClick={submitTextAnswer}>Отправить <Send /></button></div>
              </div>
            )}
          </section>

          <aside className="workspace-panel">
            {['diagnostic', 'guided'].includes(phase) && (
              <div className="thinking-canvas">
                <div className="canvas-icon"><Sparkles /></div>
                <span>{phase === 'diagnostic' ? 'Диагностика без оценки' : 'Совместное рассуждение'}</span>
                <h2>{phase === 'diagnostic' ? 'Сначала выясняем исходную модель.' : 'Теперь строим способ решения.'}</h2>
                <p>{phase === 'diagnostic' ? 'Ошибка здесь не снижает итог. Она определяет, какое объяснение даст преподаватель.' : 'Преподаватель ждёт не угадывания, а последовательного выполнения строк.'}</p>
                <div className="mini-model"><div><b>1</b><span>прочитать строку</span></div><ArrowRight /><div><b>2</b><span>вычислить справа</span></div><ArrowRight /><div><b>3</b><span>сохранить слева</span></div></div>
              </div>
            )}

            {activeTask && (
              <div className="code-studio">
                <div className="studio-head"><div><span>{phase === 'code' ? 'Практика с поддержкой' : 'Независимая проверка'}</span><h2>{activeTask.prompt}</h2></div><Code2 /></div>
                <div className="editor-label"><span>main.py</span><b>Python в браузере</b></div>
                <textarea className="code-editor" value={code} onChange={(event) => { setCode(event.target.value); setRunResult(null); }} spellCheck="false" />
                <div className="studio-actions"><button className="secondary" disabled={running} onClick={() => showHint()}><Lightbulb /> Подсказка {currentHints ? `(${currentHints})` : ''}</button><button className="run-button" disabled={running || !code.trim()} onClick={executeCode}>{running ? <LoaderCircle className="spin" /> : <Play />} {running ? 'Запускаю Python…' : 'Запустить и проверить'}</button></div>

                {runResult && (
                  <div className="run-report">
                    <div className="output-box"><span>Вывод программы</span><pre>{runResult.error || runResult.output || 'Программа ничего не вывела.'}</pre></div>
                    <div className="test-list"><div><b>Автоматические проверки</b><span>{testPassed}/{runResult.tests.length}</span></div>{runResult.tests.map((test) => <article key={test.name} className={test.passed ? 'passed' : 'failed'}>{test.passed ? <CheckCircle2 /> : <CircleAlert />}<span>{test.name}</span></article>)}</div>
                  </div>
                )}
              </div>
            )}

            {phase === 'summary' && summary && (
              <div className="summary-panel">
                <div className="summary-score"><span>Доказанное освоение</span><b>{summary.overall}%</b><p>{summary.independent ? 'Самостоятельная задача решена без подсказки.' : 'Навык подтверждён, но требуется повтор без помощи.'}</p></div>
                <div className="skill-growth">
                  {definition.skills.map((skill) => <article key={skill.slug}><div><b>{skill.title}</b><span>{summary.before[skill.slug]}% → {summary.after[skill.slug]}%</span></div><div className="growth-track"><i className="before" style={{ width: `${summary.before[skill.slug]}%` }} /><i className="after" style={{ width: `${summary.after[skill.slug]}%` }} /></div></article>)}
                </div>
                <div className="evidence-grid"><article><b>{summary.durationMinutes} мин</b><span>реальная длительность</span></article><article><b>{summary.totalHints}</b><span>подсказок использовано</span></article><article><b>{attempts.code + attempts.transfer}</b><span>запусков кода</span></article></div>
                <div className="next-action"><RotateCcw /><div><b>Почему выбран следующий шаг</b><p>{summary.nextAction}</p></div></div>
                <button className="primary wide" onClick={leaveSession}>Вернуться в Академию <ArrowRight /></button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
