import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('../src/data/subjectScenarios.js', import.meta.url);
let source = await readFile(path, 'utf8');

source = source.replace(
  "prompt: 'На столе карты A, D, 4 и 7. У каждой с одной стороны буква, с другой число. Правило: «Если на одной стороне гласная, то на другой чётное число». Какие карты обязательно перевернуть для проверки правила?',\n          allKeywords: ['a', '7'],",
  "prompt: 'На столе карты A, D, 4 и 7. У каждой с одной стороны буква, с другой число. Правило: «Если на одной стороне гласная, то на другой чётное число». Какие карты обязательно перевернуть для проверки правила?',\n          accepted: ['A и 7', 'А и 7', 'A 7', 'А 7'],\n          allKeywords: ['a', '7'],"
);
source = source.replace(
  "prompt: 'Есть три выключателя в одной комнате и одна лампа в соседней. Только один выключатель связан с лампой. В комнату с лампой можно войти один раз. Как определить нужный выключатель?',",
  "prompt: 'Есть три выключателя в одной комнате и одна лампа накаливания в соседней. Только один выключатель связан с лампой. В комнату с лампой можно войти один раз. Как определить нужный выключатель?',"
);
source = source.replace("allKeywords: ['обоих', 'конц', 'втор'],", "allKeywords: ['конц', 'втор'],");
source = source.replace("options: ['интелегентный', 'интеллигентный', 'интеллигентный']", "options: ['интелегентный', 'интеллигентный', 'интеллегентный']");
source = source.replace(
  "{ id: 'ru-8', type: 'choice', skill: 'ru_spelling', difficulty: 3, prompt: 'Где пишется НН?', options: ['жаре__ая картошка', 'краше__ый забор', 'ране__ый солдат без зависимых слов'], correctOption: 'краше__ый забор', hints: ['Полное страдательное причастие с приставкой обычно имеет НН.'], explanation: 'Крашенный забор — НН. В остальных данных формах возможно одно Н по контексту.' },",
  "{ id: 'ru-8', type: 'choice', skill: 'ru_spelling', difficulty: 3, prompt: 'В каком слове на месте пропуска пишется НН?', options: ['деревя__ый стол', 'кожа__ая куртка', 'ветре__ый день'], correctOption: 'деревя__ый стол', hints: ['Вспомни слова-исключения с суффиксом -янн-.'], explanation: 'Деревянный пишется с НН; кожаный и ветреный — с одной Н.' },"
);

const functionStart = source.indexOf('export function buildAdaptivePlan');
if (functionStart === -1) throw new Error('buildAdaptivePlan not found');

const adaptiveFunction = `export function buildAdaptivePlan(scenario, minutes, energy) {
  const countByMinutes = { 15: 3, 30: 5, 45: 7, 60: 9, 75: 11, 90: 13 };
  const nearest = [15, 30, 45, 60, 75, 90].reduce((best, value) => Math.abs(value - minutes) < Math.abs(best - minutes) ? value : best, 30);
  const baseCount = countByMinutes[nearest];
  const adjustment = energy <= 3 ? -2 : energy >= 8 ? 1 : 0;
  const tasks = scenario.definition.tasks;
  const ceiling = energy <= 3 ? 3 : energy <= 7 ? 4 : 5;
  const targetDifficulty = energy <= 3 ? 2 : energy <= 5 ? 3 : energy <= 7 ? 4 : 5;
  const desiredCount = Math.max(3, Math.min(tasks.length, baseCount + adjustment));
  const eligible = tasks.filter((task) => task.difficulty <= ceiling);
  const targetCount = Math.min(desiredCount, eligible.length);
  const selected = [];
  const selectedIds = new Set();
  const skills = scenario.definition.skills.map((skill) => skill.slug);

  const rank = (task) => {
    const distance = Math.abs(task.difficulty - targetDifficulty);
    const difficultyPreference = energy >= 6 ? -task.difficulty : task.difficulty;
    const visualBonus = task.type === 'game' && minutes >= 30 ? -3 : 0;
    return distance * 20 + difficultyPreference + visualBonus;
  };

  const add = (task) => {
    if (!task || selectedIds.has(task.id) || selected.length >= targetCount) return;
    selected.push(task);
    selectedIds.add(task.id);
  };

  for (const skill of skills) {
    const candidate = eligible
      .filter((task) => task.skill === skill)
      .sort((a, b) => rank(a) - rank(b))[0];
    add(candidate);
  }

  const desiredGames = minutes >= 60 && energy >= 5 ? 2 : minutes >= 30 ? 1 : 0;
  const gameCandidates = eligible
    .filter((task) => task.type === 'game')
    .sort((a, b) => rank(a) - rank(b));
  while (selected.filter((task) => task.type === 'game').length < desiredGames && gameCandidates.length) {
    add(gameCandidates.shift());
  }

  const remaining = eligible
    .filter((task) => !selectedIds.has(task.id))
    .sort((a, b) => rank(a) - rank(b));

  const skillCounts = Object.fromEntries(skills.map((skill) => [skill, selected.filter((task) => task.skill === skill).length]));
  while (selected.length < targetCount && remaining.length) {
    remaining.sort((a, b) => {
      const balance = (skillCounts[a.skill] || 0) - (skillCounts[b.skill] || 0);
      return balance !== 0 ? balance : rank(a) - rank(b);
    });
    const next = remaining.shift();
    add(next);
    skillCounts[next.skill] = (skillCounts[next.skill] || 0) + 1;
  }

  return {
    tasks: selected,
    targetCount: selected.length,
    mode: energy <= 3 ? 'Восстановительный' : energy >= 8 ? 'Глубокий фокус' : 'Рабочий',
    explanationStyle: energy <= 3 ? 'короткие объяснения и больше опор' : energy >= 8 ? 'минимум подсказок и сложный перенос' : 'баланс объяснения и самостоятельности',
    maxDifficulty: selected.length ? Math.max(...selected.map((task) => task.difficulty)) : 0
  };
}
`;

source = source.slice(0, functionStart) + adaptiveFunction;
await writeFile(path, source, 'utf8');
console.log('Adaptive lesson definitions validated and difficulty-balanced.');
