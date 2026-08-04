import { subjectScenarios } from './subjectScenarios';

function addTasks(subject, index, additions) {
  const scenario = subjectScenarios.find((item) => item.subject === subject);
  if (!scenario) return;
  const existing = new Set(scenario.definition.tasks.map((task) => task.id));
  const unique = additions.filter((task) => !existing.has(task.id));
  scenario.definition.tasks.splice(index, 0, ...unique);
}

addTasks('cognition', 4, [
  {
    id: 'cog-stroop-sprint',
    type: 'game',
    game: 'stroop',
    skill: 'cog_inhibition',
    difficulty: 3,
    prompt: 'Мини-игра «Струп»: выбирай цвет букв, игнорируя значение написанного слова. Ошибка обычно возникает, когда чтение перехватывает управление.',
    gameData: {
      required: 6,
      rounds: [
        { word: 'КРАСНЫЙ', ink: 'blue', answer: 'Синий' },
        { word: 'ЗЕЛЁНЫЙ', ink: 'pink', answer: 'Розовый' },
        { word: 'СИНИЙ', ink: 'yellow', answer: 'Жёлтый' },
        { word: 'ЖЁЛТЫЙ', ink: 'green', answer: 'Зелёный' },
        { word: 'РОЗОВЫЙ', ink: 'red', answer: 'Красный' },
        { word: 'КРАСНЫЙ', ink: 'green', answer: 'Зелёный' },
        { word: 'СИНИЙ', ink: 'red', answer: 'Красный' },
        { word: 'ЗЕЛЁНЫЙ', ink: 'blue', answer: 'Синий' }
      ],
      options: ['Красный', 'Синий', 'Зелёный', 'Жёлтый', 'Розовый']
    },
    hints: ['Перед нажатием назови про себя только цвет букв.', 'Смотри на визуальный признак и не проговаривай слово.'],
    explanation: 'Задача измеряет способность подавить автоматическое чтение и выполнить менее привычное правило.'
  },
  {
    id: 'cog-memory-grid',
    type: 'game',
    game: 'memory-grid',
    skill: 'cog_working_memory',
    difficulty: 4,
    prompt: 'Запомни расположение подсвеченных клеток. Через несколько секунд рисунок исчезнет — восстанови его без подсказки.',
    gameData: { gridSize: 4, pattern: [0, 3, 5, 6, 9, 12, 14], revealMs: 3200 },
    hints: ['Сгруппируй клетки в две фигуры, а не запоминай семь отдельных позиций.'],
    explanation: 'Группировка снижает нагрузку на рабочую память и превращает набор точек в структуру.'
  },
  {
    id: 'cog-matrix-pattern',
    type: 'game',
    game: 'matrix-choice',
    skill: 'cog_strategy',
    difficulty: 4,
    prompt: 'Выбери фигуру, которая завершает матрицу. Одновременно отслеживай форму, количество элементов и чередование заливки.',
    gameData: {
      cells: [
        { shape: 'circle', count: 1, filled: false },
        { shape: 'circle', count: 2, filled: true },
        { shape: 'circle', count: 3, filled: false },
        { shape: 'triangle', count: 1, filled: true },
        { shape: 'triangle', count: 2, filled: false },
        { shape: 'triangle', count: 3, filled: true },
        { shape: 'square', count: 1, filled: false },
        { shape: 'square', count: 2, filled: true },
        null
      ],
      options: [
        { id: 'a', shape: 'square', count: 3, filled: false },
        { id: 'b', shape: 'circle', count: 3, filled: true },
        { id: 'c', shape: 'square', count: 2, filled: false },
        { id: 'd', shape: 'triangle', count: 3, filled: false }
      ],
      correct: 'a'
    },
    hints: ['Каждая строка сохраняет форму, а количество растёт слева направо.', 'Заливка чередуется и по строкам, и по столбцам.'],
    explanation: 'Нужны три незалитых квадрата: форма задаётся строкой, количество — столбцом, заливка продолжает чередование.'
  },
  {
    id: 'cog-conditional-logic',
    type: 'choice',
    skill: 'cog_logic',
    difficulty: 5,
    prompt: 'На острове правдивцы всегда говорят правду, лжецы всегда лгут. А говорит: «Мы с Б одного типа». Б говорит: «А — лжец». Кто они?',
    options: ['А правдивец, Б лжец', 'А лжец, Б правдивец', 'Оба правдивцы', 'Оба лжецы'],
    correctOption: 'А лжец, Б правдивец',
    hints: ['Проверь отдельно предположение, что А говорит правду.', 'Если А лжёт, они разного типа; тогда высказывание Б об А истинно.'],
    explanation: 'А — лжец, Б — правдивец. При этой комбинации оба высказывания получают требуемые значения истинности.'
  },
  {
    id: 'cog-sampling-graph',
    type: 'game',
    game: 'graph-choice',
    skill: 'cog_probability',
    difficulty: 5,
    prompt: 'На графике показаны результаты четырёх маленьких выборок. Какой вывод наиболее обоснован?',
    gameData: {
      title: 'Доля успехов в четырёх выборках',
      values: [80, 20, 65, 35],
      labels: ['n=5', 'n=5', 'n=100', 'n=100'],
      options: [
        'Маленькие выборки сильнее колеблются случайно',
        'Первая группа объективно в четыре раза способнее второй',
        'Размер выборки не влияет на разброс результатов'
      ],
      correct: 'Маленькие выборки сильнее колеблются случайно'
    },
    hints: ['Сравни разброс пар с n=5 и n=100.', 'Малое число наблюдений даёт более нестабильные доли.'],
    explanation: 'Маленькие выборки дают более крайние результаты даже при одинаковой истинной вероятности.'
  }
]);

addTasks('programming', 3, [
  {
    id: 'py-flow-order-game',
    type: 'game',
    game: 'sequence-builder',
    skill: 'python_execution_order',
    difficulty: 3,
    prompt: 'Собери порядок состояний переменной x для программы: x=2; x=x*3; x=x+4; x=x//2.',
    gameData: {
      tokens: ['2', '6', '10', '5'],
      correct: ['2', '6', '10', '5'],
      caption: 'Нажимай значения в порядке их появления.'
    },
    hints: ['Выполняй по одной операции и не перескакивай к итоговому ответу.'],
    explanation: 'Последовательность состояний: 2 → 6 → 10 → 5.'
  },
  {
    id: 'py-nested-trace',
    type: 'text',
    skill: 'python_output_prediction',
    difficulty: 5,
    prompt: 'Что выведет код?\n\ntotal = 0\nfor i in range(1, 4):\n    for j in range(i):\n        total += i + j\nprint(total)',
    numeric: 18,
    tolerance: 0,
    hints: ['Выпиши пары (i, j): (1,0), (2,0), (2,1), (3,0), (3,1), (3,2).'],
    explanation: 'Сумма приращений: 1 + 2 + 3 + 3 + 4 + 5 = 18.'
  },
  {
    id: 'py-robust-function',
    type: 'code',
    skill: 'python_code_write',
    difficulty: 5,
    prompt: 'Напиши функцию clamp(value, low, high), которая возвращает low, если value ниже границы, high — если выше, иначе само value.',
    starter: 'def clamp(value, low, high):\n    # напиши решение\n    pass\n',
    tests: [
      { name: 'Нижняя граница', expression: 'clamp(-3, 0, 10) == 0' },
      { name: 'Внутри диапазона', expression: 'clamp(7, 0, 10) == 7' },
      { name: 'Верхняя граница', expression: 'clamp(15, 0, 10) == 10' },
      { name: 'Другой диапазон', expression: 'clamp(4, 5, 9) == 5' }
    ],
    hints: ['Проверь нижнюю и верхнюю границы отдельными условиями.', 'После проверок можно вернуть value.'],
    explanation: 'Функция демонстрирует ветвление, ранний возврат и повторное использование логики.'
  }
]);

addTasks('english', 4, [
  {
    id: 'en-sentence-builder',
    type: 'game',
    game: 'sequence-builder',
    skill: 'en_word_order',
    difficulty: 3,
    prompt: 'Собери естественное английское предложение из частей.',
    gameData: {
      tokens: ['Although', 'he', 'was', 'tired,', 'he', 'finished', 'the task.'],
      shuffled: ['the task.', 'was', 'Although', 'he', 'finished', 'tired,', 'he'],
      correct: ['Although', 'he', 'was', 'tired,', 'he', 'finished', 'the task.'],
      caption: 'Учитывай придаточную часть, запятую и порядок слов в главной части.'
    },
    hints: ['Сначала собери конструкцию Although + подлежащее + was + признак.', 'После запятой снова нужны подлежащее и сказуемое.'],
    explanation: 'Although he was tired, he finished the task.'
  },
  {
    id: 'en-context-choice',
    type: 'choice',
    skill: 'en_comprehension',
    difficulty: 5,
    prompt: 'Выбери наиболее естественный ответ. — Would you mind opening the window?',
    options: ['Yes, I would mind.', 'Not at all.', 'I am opening yesterday.', 'No, I do not window.'],
    correctOption: 'Not at all.',
    hints: ['Вежливый вопрос спрашивает, не возражаешь ли ты.'],
    explanation: 'Not at all означает «совсем не возражаю» и естественно принимает просьбу.'
  },
  {
    id: 'en-reference-trap',
    type: 'choice',
    skill: 'en_comprehension',
    difficulty: 4,
    prompt: 'Tom told Alex that he had missed the train. Что можно утверждать точно?',
    options: ['Поезд пропустил только Tom', 'Поезд пропустил только Alex', 'Местоимение he двусмысленно без контекста'],
    correctOption: 'Местоимение he двусмысленно без контекста',
    hints: ['Проверь, к какому из двух мужских имён может относиться he.'],
    explanation: 'Без контекста he может относиться и к Tom, и к Alex.'
  }
]);

addTasks('russian', 4, [
  {
    id: 'ru-punctuation-builder',
    type: 'game',
    game: 'sequence-builder',
    skill: 'ru_punctuation',
    difficulty: 3,
    prompt: 'Собери предложение с корректной структурой и пунктуацией.',
    gameData: {
      shuffled: ['мы продолжили путь.', 'Когда туман рассеялся,', 'хотя дорога оставалась скользкой,'],
      tokens: ['Когда туман рассеялся,', 'хотя дорога оставалась скользкой,', 'мы продолжили путь.'],
      correct: ['Когда туман рассеялся,', 'хотя дорога оставалась скользкой,', 'мы продолжили путь.'],
      caption: 'Определи зависимость частей, а не только расположение запятых.'
    },
    hints: ['Сначала идёт придаточное времени, затем уступки, затем главная часть.'],
    explanation: 'Когда туман рассеялся, хотя дорога оставалась скользкой, мы продолжили путь.'
  },
  {
    id: 'ru-semantic-scope',
    type: 'choice',
    skill: 'ru_meaning',
    difficulty: 5,
    prompt: 'Какой вариант однозначно сообщает, что именно не все сотрудники прошли проверку?',
    options: ['Все сотрудники не прошли проверку.', 'Не все сотрудники прошли проверку.', 'Сотрудники все не прошли проверку.'],
    correctOption: 'Не все сотрудники прошли проверку.',
    hints: ['Положение отрицания меняет область его действия.'],
    explanation: '«Не все» означает, что часть прошла, а часть нет; «все не прошли» обычно понимается как ни один не прошёл.'
  },
  {
    id: 'ru-argument-structure',
    type: 'choice',
    skill: 'ru_meaning',
    difficulty: 4,
    prompt: 'Какое продолжение делает рассуждение логически корректным? «Новый метод быстрее прежнего, но даёт больше ошибок, поэтому…»',
    options: ['он безусловно лучше', 'нужно сравнить цену скорости и ошибок для нашей задачи', 'скорость всегда важнее точности'],
    correctOption: 'нужно сравнить цену скорости и ошибок для нашей задачи',
    hints: ['Из двух противонаправленных свойств нельзя вывести абсолютную оценку без критерия.'],
    explanation: 'Нужно определить, какой компромисс приемлем в конкретной задаче.'
  }
]);

addTasks('math', 4, [
  {
    id: 'ma-graph-rate',
    type: 'game',
    game: 'graph-choice',
    skill: 'math_reasoning',
    difficulty: 3,
    prompt: 'На графике показано расстояние по минутам. На каком участке скорость была наибольшей?',
    gameData: {
      title: 'Расстояние, км',
      values: [0, 2, 7, 9, 17],
      labels: ['0', '10', '20', '30', '40 мин'],
      mode: 'line',
      options: ['0–10 минут', '10–20 минут', '20–30 минут', '30–40 минут'],
      correct: '30–40 минут'
    },
    hints: ['Скорость на графике расстояния — это крутизна участка.', 'Сравни прирост расстояния за одинаковые 10 минут.'],
    explanation: 'На последнем участке расстояние выросло на 8 км — это самый большой прирост.'
  },
  {
    id: 'ma-equation-steps',
    type: 'game',
    game: 'sequence-builder',
    skill: 'math_equations',
    difficulty: 4,
    prompt: 'Расположи преобразования уравнения 3(2x − 1) = 21 в правильном порядке.',
    gameData: {
      shuffled: ['2x = 8', '6x − 3 = 21', 'x = 4', '6x = 24'],
      tokens: ['6x − 3 = 21', '6x = 24', '2x = 8', 'x = 4'],
      correct: ['6x − 3 = 21', '6x = 24', '2x = 8', 'x = 4'],
      caption: 'Каждая строка должна быть равносильна предыдущей.'
    },
    hints: ['Сначала раскрой скобки.', 'Затем прибавь 3 к обеим частям.'],
    explanation: 'После раскрытия скобок последовательно получаем 6x−3=21, 6x=24, 2x=8, x=4.'
  },
  {
    id: 'ma-invariant',
    type: 'choice',
    skill: 'math_reasoning',
    difficulty: 5,
    prompt: 'На доске написаны числа 1, 2, 3, 4. За ход выбирают два числа a и b и заменяют их числом a+b−1. После трёх ходов останется одно число. Какое?',
    options: ['Зависит от выбора пар', '7', '10', '4'],
    correctOption: '7',
    hints: ['Проследи, как меняется сумма всех чисел за один ход.', 'Каждый ход уменьшает общую сумму ровно на 1.'],
    explanation: 'Начальная сумма 10. После трёх ходов она уменьшится на 3, поэтому останется 7 независимо от выбора пар.'
  },
  {
    id: 'ma-balance-visual',
    type: 'game',
    game: 'balance-choice',
    skill: 'math_equations',
    difficulty: 4,
    prompt: 'Весы уравновешены. Найди массу одной розовой фигуры.',
    gameData: {
      left: [{ kind: 'unknown', count: 3 }, { kind: 'weight', value: 2, count: 1 }],
      right: [{ kind: 'weight', value: 20, count: 1 }],
      options: ['4', '6', '8', '18'],
      correct: '6'
    },
    hints: ['Сначала убери одинаковое известное действие с обеих сторон: 3x + 2 = 20.', 'После вычитания 2 раздели остаток на три.'],
    explanation: '3x+2=20, значит 3x=18 и x=6.'
  }
]);

for (const scenario of subjectScenarios) {
  scenario.definition.tasks.forEach((task) => {
    if (task.difficulty === 1 && scenario.subject !== 'programming') task.difficulty = 2;
  });
}
