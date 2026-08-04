import { useEffect, useMemo, useState } from 'react';
import { Check, Eye, RotateCcw, TimerReset, Undo2 } from 'lucide-react';

const inkColors = {
  red: '#ff4d6d',
  blue: '#39b8ff',
  green: '#48d597',
  yellow: '#ffd166',
  pink: '#ff55b7'
};

function VisualGlyph({ descriptor, compact = false }) {
  if (!descriptor) return <span className="visual-missing">?</span>;
  const count = Math.max(1, Number(descriptor.count || 1));
  return (
    <div className={`visual-glyph ${compact ? 'compact' : ''}`}>
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={`glyph-shape ${descriptor.shape || 'circle'} ${descriptor.filled ? 'filled' : ''}`}
          style={{ transform: `rotate(${Number(descriptor.rotation || 0)}deg)` }}
        />
      ))}
    </div>
  );
}

function StroopGame({ task, onComplete }) {
  const rounds = task.gameData.rounds || [];
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);
  const round = rounds[index];

  function choose(option) {
    if (!round || locked) return;
    setLocked(true);
    const correct = option === round.answer;
    const nextScore = score + (correct ? 1 : 0);
    setScore(nextScore);
    window.setTimeout(() => {
      if (index >= rounds.length - 1) {
        onComplete({
          correct: nextScore >= Number(task.gameData.required || rounds.length),
          answer: `Струп: ${nextScore}/${rounds.length}`,
          details: { score: nextScore, total: rounds.length }
        });
      } else {
        setIndex((value) => value + 1);
        setLocked(false);
      }
    }, 260);
  }

  return (
    <div className="mini-game stroop-game">
      <div className="game-head"><span>Раунд {index + 1}/{rounds.length}</span><b>{score} верно</b></div>
      <div className="stroop-word" style={{ color: inkColors[round?.ink] || '#fff' }}>{round?.word}</div>
      <p>Нажми название цвета букв, а не прочитанное слово.</p>
      <div className="stroop-options">
        {(task.gameData.options || []).map((option) => (
          <button key={option} disabled={locked} onClick={() => choose(option)}>{option}</button>
        ))}
      </div>
    </div>
  );
}

function MemoryGridGame({ task, onComplete }) {
  const size = Number(task.gameData.gridSize || 4);
  const pattern = task.gameData.pattern || [];
  const [revealed, setRevealed] = useState(true);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setRevealed(false), Number(task.gameData.revealMs || 2800));
    return () => window.clearTimeout(timer);
  }, [task.id]);

  function toggle(index) {
    if (revealed) return;
    setSelected((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  }

  function submit() {
    const expected = [...pattern].sort((a, b) => a - b);
    const actual = [...selected].sort((a, b) => a - b);
    const correct = expected.length === actual.length && expected.every((value, index) => value === actual[index]);
    onComplete({ correct, answer: `Клетки: ${actual.join(', ') || 'не выбраны'}`, details: { expected, actual } });
  }

  return (
    <div className="mini-game memory-game">
      <div className="game-head">
        <span>{revealed ? <><Eye /> Запоминай рисунок</> : <><TimerReset /> Восстанови рисунок</>}</span>
        <b>{selected.length}/{pattern.length}</b>
      </div>
      <div className="memory-grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
        {Array.from({ length: size * size }, (_, index) => {
          const active = revealed ? pattern.includes(index) : selected.includes(index);
          return <button key={index} className={active ? 'active' : ''} onClick={() => toggle(index)} aria-label={`Клетка ${index + 1}`} />;
        })}
      </div>
      {revealed ? (
        <button className="secondary game-wide" onClick={() => setRevealed(false)}>Готов запоминать</button>
      ) : (
        <button className="primary game-wide" disabled={!selected.length} onClick={submit}><Check /> Проверить рисунок</button>
      )}
    </div>
  );
}

function MatrixChoiceGame({ task, onComplete }) {
  const data = task.gameData;
  return (
    <div className="mini-game matrix-game">
      <div className="matrix-board">
        {(data.cells || []).map((cell, index) => (
          <div key={index} className={`matrix-cell ${cell ? '' : 'missing'}`}><VisualGlyph descriptor={cell} /></div>
        ))}
      </div>
      <div className="matrix-options">
        {(data.options || []).map((option) => (
          <button key={option.id} onClick={() => onComplete({
            correct: option.id === data.correct,
            answer: `Вариант ${option.id.toUpperCase()}`,
            details: { option: option.id }
          })}>
            <span>{option.id.toUpperCase()}</span><VisualGlyph descriptor={option} compact />
          </button>
        ))}
      </div>
    </div>
  );
}

function GraphChoiceGame({ task, onComplete }) {
  const data = task.gameData;
  const values = data.values || [];
  const max = Math.max(...values, 1);
  const width = 520;
  const height = 250;
  const padding = 34;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const points = values.map((value, index) => ({
    x: padding + (values.length === 1 ? usableWidth / 2 : index * usableWidth / (values.length - 1)),
    y: height - padding - value / max * usableHeight
  }));
  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <div className="mini-game graph-game">
      <div className="graph-title">{data.title}</div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={data.title || 'График'}>
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="graph-axis" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="graph-axis" />
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <line key={ratio} x1={padding} y1={height - padding - usableHeight * ratio} x2={width - padding} y2={height - padding - usableHeight * ratio} className="graph-gridline" />
        ))}
        {data.mode === 'line' ? (
          <>
            <polyline points={polyline} className="graph-line" />
            {points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="7" className="graph-point" />)}
          </>
        ) : values.map((value, index) => {
          const barWidth = usableWidth / values.length * 0.58;
          const x = padding + index * usableWidth / values.length + (usableWidth / values.length - barWidth) / 2;
          const barHeight = value / max * usableHeight;
          return <rect key={index} x={x} y={height - padding - barHeight} width={barWidth} height={barHeight} rx="8" className="graph-bar" />;
        })}
        {(data.labels || []).map((label, index) => {
          const x = data.mode === 'line'
            ? points[index]?.x
            : padding + index * usableWidth / values.length + usableWidth / values.length / 2;
          return <text key={label} x={x} y={height - 10} textAnchor="middle" className="graph-label">{label}</text>;
        })}
        {values.map((value, index) => {
          const x = data.mode === 'line'
            ? points[index]?.x
            : padding + index * usableWidth / values.length + usableWidth / values.length / 2;
          const y = data.mode === 'line' ? points[index]?.y - 12 : height - padding - value / max * usableHeight - 10;
          return <text key={`${value}-${index}`} x={x} y={y} textAnchor="middle" className="graph-value">{value}</text>;
        })}
      </svg>
      <div className="graph-options">
        {(data.options || []).map((option) => (
          <button key={option} onClick={() => onComplete({ correct: option === data.correct, answer: option, details: { option } })}>{option}</button>
        ))}
      </div>
    </div>
  );
}

function SequenceBuilderGame({ task, onComplete }) {
  const source = task.gameData.shuffled || task.gameData.tokens || [];
  const pool = useMemo(() => source.map((text, index) => ({ id: `${index}-${text}`, text })), [task.id]);
  const [chosen, setChosen] = useState([]);

  function add(token) {
    setChosen((current) => [...current, token]);
  }

  function undo(index) {
    setChosen((current) => current.filter((_item, itemIndex) => itemIndex !== index));
  }

  const unused = pool.filter((token) => !chosen.some((item) => item.id === token.id));

  function submit() {
    const answer = chosen.map((item) => item.text);
    const correct = answer.length === task.gameData.correct.length
      && answer.every((value, index) => value === task.gameData.correct[index]);
    onComplete({ correct, answer: answer.join(' '), details: { order: answer } });
  }

  return (
    <div className="mini-game sequence-game">
      <p>{task.gameData.caption}</p>
      <div className="sequence-result">
        {chosen.length ? chosen.map((token, index) => (
          <button key={token.id} onClick={() => undo(index)} title="Убрать"><span>{index + 1}</span>{token.text}<Undo2 /></button>
        )) : <span>Нажимай элементы в нужном порядке</span>}
      </div>
      <div className="sequence-pool">
        {unused.map((token) => <button key={token.id} onClick={() => add(token)}>{token.text}</button>)}
      </div>
      <div className="sequence-actions">
        <button className="secondary" onClick={() => setChosen([])} disabled={!chosen.length}><RotateCcw /> Сбросить</button>
        <button className="primary" onClick={submit} disabled={chosen.length !== pool.length}><Check /> Проверить порядок</button>
      </div>
    </div>
  );
}

function BalanceChoiceGame({ task, onComplete }) {
  const data = task.gameData;
  function renderSide(items) {
    return items.flatMap((item, groupIndex) => Array.from({ length: Number(item.count || 1) }, (_, index) => (
      item.kind === 'unknown'
        ? <span className="balance-unknown" key={`${groupIndex}-${index}`}>?</span>
        : <span className="balance-weight" key={`${groupIndex}-${index}`}>{item.value}</span>
    )));
  }

  return (
    <div className="mini-game balance-game">
      <div className="balance-visual">
        <div className="balance-pan">{renderSide(data.left || [])}</div>
        <div className="balance-beam"><i /></div>
        <div className="balance-pan">{renderSide(data.right || [])}</div>
      </div>
      <div className="graph-options">
        {(data.options || []).map((option) => (
          <button key={option} onClick={() => onComplete({ correct: option === data.correct, answer: option, details: { option } })}>{option}</button>
        ))}
      </div>
    </div>
  );
}

export default function MiniGameTask({ task, onComplete }) {
  if (!task) return null;
  if (task.game === 'stroop') return <StroopGame task={task} onComplete={onComplete} />;
  if (task.game === 'memory-grid') return <MemoryGridGame task={task} onComplete={onComplete} />;
  if (task.game === 'matrix-choice') return <MatrixChoiceGame task={task} onComplete={onComplete} />;
  if (task.game === 'graph-choice') return <GraphChoiceGame task={task} onComplete={onComplete} />;
  if (task.game === 'sequence-builder') return <SequenceBuilderGame task={task} onComplete={onComplete} />;
  if (task.game === 'balance-choice') return <BalanceChoiceGame task={task} onComplete={onComplete} />;
  return <div className="mini-game game-unsupported">Неизвестный тип мини-игры.</div>;
}
