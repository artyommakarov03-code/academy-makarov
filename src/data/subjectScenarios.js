export const subjectScenarios = [
  {
    slug: 'cognition-foundations-1',
    subject: 'cognition',
    title: 'Когнитивные способности',
    shortTitle: 'Мышление',
    description: 'Логика, рабочая память, вероятности, торможение импульсивного ответа и перенос стратегий.',
    accent: 'violet',
    definition: {
      promise: 'Ты не просто решишь задачи, а увидишь, где мышление торопится, подменяет условие или замечает ложную закономерность.',
      skills: [
        { slug: 'cog_inhibition', title: 'Торможение первого ответа', baseline: 10 },
        { slug: 'cog_logic', title: 'Логическое рассуждение', baseline: 10 },
        { slug: 'cog_working_memory', title: 'Рабочая память', baseline: 10 },
        { slug: 'cog_probability', title: 'Вероятностное мышление', baseline: 5 },
        { slug: 'cog_strategy', title: 'Стратегия и перенос', baseline: 10 }
      ],
      tasks: [
        {
          id: 'bat-ball', type: 'text', skill: 'cog_inhibition', difficulty: 1,
          prompt: 'Бита и мяч вместе стоят 110 рублей. Бита стоит на 100 рублей дороже мяча. Сколько стоит мяч?',
          numeric: 5, tolerance: 0,
          hints: ['Не вычитай 100 напрямую. Обозначь цену мяча за x.', 'Тогда бита стоит x + 100, а вместе получается 2x + 100.'],
          explanation: 'Мяч стоит 5 рублей, бита — 105. Быстрый ответ 10 возникает, когда мозг проверяет только разницу, но не сумму.'
        },
        {
          id: 'reverse-span', type: 'text', skill: 'cog_working_memory', difficulty: 1,
          prompt: 'Не записывая промежуточные шаги, введи числа в обратном порядке: 8 — 1 — 4 — 9 — 2.',
          accepted: ['2 9 4 1 8', '29418', '2-9-4-1-8'],
          hints: ['Разбей ряд на две части: 8-1 и 4-9-2.', 'Начни с последнего элемента и двигайся влево.'],
          explanation: 'Верный обратный ряд: 2 — 9 — 4 — 1 — 8. Это короткая нагрузка на удержание и преобразование информации.'
        },
        {
          id: 'all-but-nine', type: 'text', skill: 'cog_inhibition', difficulty: 1,
          prompt: 'У фермера было 17 овец. Все, кроме 9, погибли. Сколько овец осталось?',
          numeric: 9, tolerance: 0,
          hints: ['Фраза «все, кроме 9» уже сообщает число выживших.'],
          explanation: 'Осталось 9. Здесь ловушка не математическая, а языковая: привычка запускает вычитание, хотя оно не требуется.'
        },
        {
          id: 'sequence-differences', type: 'text', skill: 'cog_strategy', difficulty: 2,
          prompt: 'Продолжи ряд: 2, 3, 5, 8, 12, 17, …',
          numeric: 23, tolerance: 0,
          hints: ['Посмотри не на сами числа, а на разности между соседними.', 'Разности равны 1, 2, 3, 4, 5.'],
          explanation: 'Следующая разность — 6, поэтому ответ 23. Полезная стратегия: сначала исследовать изменения, а не угадывать формулу.'
        },
        {
          id: 'wason-cards', type: 'text', skill: 'cog_logic', difficulty: 3,
          prompt: 'На столе карты A, D, 4 и 7. У каждой с одной стороны буква, с другой число. Правило: «Если на одной стороне гласная, то на другой чётное число». Какие карты обязательно перевернуть для проверки правила?',
          allKeywords: ['a', '7'],
          hints: ['Нужно искать не только подтверждение, но и возможное опровержение.', 'Карта 4 не обязана иметь гласную: правило работает только в одну сторону.'],
          explanation: 'Нужно перевернуть A и 7. A проверяет следствие правила, а 7 может скрывать гласную и тем самым опровергнуть его.'
        },
        {
          id: 'syllogism-overlap', type: 'choice', skill: 'cog_logic', difficulty: 2,
          prompt: 'Все ларпы — синие. Некоторые синие предметы тяжёлые. Следует ли отсюда, что некоторые ларпы тяжёлые?',
          options: ['Да, обязательно', 'Нет, это невозможно', 'Определить нельзя'],
          correctOption: 'Определить нельзя',
          hints: ['Две группы могут находиться внутри «синих» и при этом не пересекаться.'],
          explanation: 'Определить нельзя. Ларпы и тяжёлые предметы могут быть разными подмножествами синих объектов.'
        },
        {
          id: 'two-coins', type: 'text', skill: 'cog_probability', difficulty: 4,
          prompt: 'В мешке две монеты: обычная и монета с орлом на обеих сторонах. Случайно выбрали монету и выпал орёл. Какова вероятность, что выбрана двусторонняя монета?',
          accepted: ['2/3', 'две трети', '66,7%', '66.7%', '0,667', '0.667'],
          hints: ['Перечисли равновероятные стороны, которые могли дать орла.', 'Есть три «орлиных» стороны: две у особой монеты и одна у обычной.'],
          explanation: 'Вероятность равна 2/3: среди трёх способов увидеть орла два принадлежат двусторонней монете.'
        },
        {
          id: 'pills-time', type: 'text', skill: 'cog_inhibition', difficulty: 1,
          prompt: 'Врач дал три таблетки и сказал принимать по одной каждые 30 минут. Через сколько минут будут приняты все таблетки?',
          numeric: 60, tolerance: 0,
          hints: ['Первая таблетка принимается сразу, а не через 30 минут.'],
          explanation: 'Через 60 минут: первая — сейчас, вторая — через 30 минут, третья — через 60.'
        },
        {
          id: 'switch-lamp', type: 'text', skill: 'cog_strategy', difficulty: 3,
          prompt: 'Есть три выключателя в одной комнате и одна лампа в соседней. Только один выключатель связан с лампой. В комнату с лампой можно войти один раз. Как определить нужный выключатель?',
          allKeywords: ['включ', 'выключ', 'тепл'],
          hints: ['Используй не только свет, но и другое физическое свойство лампы.', 'Один выключатель подержи включённым, затем выключи; второй включи перед входом.'],
          explanation: 'Первый включают на несколько минут и выключают, второй оставляют включённым. В соседней комнате: горящая лампа — второй, тёплая погасшая — первый, холодная — третий.'
        },
        {
          id: 'factorial-sequence', type: 'text', skill: 'cog_strategy', difficulty: 2,
          prompt: 'Продолжи ряд: 1, 2, 6, 24, 120, …',
          numeric: 720, tolerance: 0,
          hints: ['Каждый следующий член получается умножением на возрастающее целое число.', 'Умножения идут на 2, 3, 4, 5, затем на 6.'],
          explanation: 'Ответ 720: это 6! = 1×2×3×4×5×6.'
        },
        {
          id: 'rope-45', type: 'text', skill: 'cog_strategy', difficulty: 5,
          prompt: 'Есть две верёвки. Каждая полностью сгорает за 60 минут, но горит неравномерно. Как отмерить ровно 45 минут?',
          allKeywords: ['обоих', 'конц', 'втор'],
          hints: ['Если поджечь верёвку с двух концов, она сгорит за 30 минут независимо от неравномерности.', 'Одновременно подожги первую с двух концов, вторую — с одного.'],
          explanation: 'Первую верёвку поджигают с двух концов, вторую — с одного. Через 30 минут первая сгорит; тогда поджигают второй конец второй верёвки, и оставшаяся часть сгорит за 15 минут.'
        },
        {
          id: 'counterexample-prime', type: 'text', skill: 'cog_logic', difficulty: 2,
          prompt: 'Найди один контрпример утверждению: «Каждое натуральное число, оканчивающееся на 2, является простым».',
          accepted: ['12', '22', '32', '42', '52', '62', '72', '82', '92', '102'],
          hints: ['Подойдёт любое составное число с последней цифрой 2.'],
          explanation: 'Например, 12: оно оканчивается на 2, но делится на 2, 3, 4 и 6. Одного контрпримера достаточно, чтобы опровергнуть всеобщее утверждение.'
        },
        {
          id: 'bayes-test', type: 'text', skill: 'cog_probability', difficulty: 5,
          prompt: 'Болезнь есть у 1% людей. Тест выявляет её у 90% больных и даёт ложноположительный результат у 9% здоровых. Примерно какова вероятность болезни при положительном тесте?',
          accepted: ['9,2%', '9.2%', 'около 9%', '9%', '0,092', '0.092'],
          hints: ['Представь 10 000 человек: 100 больных и 9 900 здоровых.', 'Положительный тест получат 90 больных и 891 здоровый.'],
          explanation: 'Вероятность около 9,2%: 90 истинно положительных среди 981 положительного результата. Низкая базовая частота сильно меняет интуитивный ответ.'
        },
        {
          id: 'monty-hall', type: 'choice', skill: 'cog_probability', difficulty: 4,
          prompt: 'В игре три двери: за одной приз. Ты выбрал дверь, ведущий открыл одну из двух других без приза и предложил поменять выбор. Что выгоднее?',
          options: ['Остаться: вероятность выше', 'Поменять: вероятность выигрыша 2/3', 'Разницы нет: по 1/2'],
          correctOption: 'Поменять: вероятность выигрыша 2/3',
          hints: ['Первоначальный выбор был верен лишь с вероятностью 1/3.', 'Вероятность 2/3, что приз был среди двух других дверей, после открытия переносится на единственную закрытую.'],
          explanation: 'Выгоднее поменять: вероятность выигрыша становится 2/3. Открытие двери ведущим не является случайной новой жеребьёвкой.'
        },
        {
          id: 'lockers', type: 'text', skill: 'cog_strategy', difficulty: 4,
          prompt: 'Есть 10 закрытых шкафчиков. На проходе №1 переключают каждый, на проходе №2 — каждый второй, …, на проходе №10 — десятый. Какие шкафчики останутся открыты?',
          allKeywords: ['1', '4', '9'],
          hints: ['Шкафчик переключается столько раз, сколько у его номера делителей.', 'Нечётное число делителей имеют только полные квадраты.'],
          explanation: 'Останутся открыты 1, 4 и 9. Только полные квадраты имеют нечётное число делителей.'
        }
      ]
    }
  },
  {
    slug: 'python-foundations-1',
    subject: 'programming',
    title: 'Программирование: Python',
    shortTitle: 'Python',
    description: 'Переменные, порядок выполнения, вычисления и первый проверяемый код.',
    accent: 'blue',
    definition: {
      promise: 'Ты научишься читать код сверху вниз, отслеживать значения переменных и писать небольшие вычисления, которые проходят тесты.',
      skills: [
        { slug: 'python_assignment', title: 'Присваивание', baseline: 15 },
        { slug: 'python_execution_order', title: 'Порядок выполнения', baseline: 10 },
        { slug: 'python_output_prediction', title: 'Прогноз вывода', baseline: 5 },
        { slug: 'python_code_write', title: 'Написание кода', baseline: 5 }
      ],
      tasks: [
        { id: 'py-1', type: 'text', skill: 'python_output_prediction', difficulty: 1, prompt: 'Что выведет код?\n\nx = 4\nx = x + 3\nprint(x)', numeric: 7, tolerance: 0, hints: ['Выполняй строки сверху вниз.'], explanation: 'После второй строки x становится равен 7.' },
        { id: 'py-2', type: 'text', skill: 'python_execution_order', difficulty: 1, prompt: 'Что выведет код?\n\na = 2\nb = a + 5\na = 10\nprint(b)', numeric: 7, tolerance: 0, hints: ['Изменение a после вычисления b не меняет уже сохранённое b.'], explanation: 'b получил значение 7 до того, как a изменилось.' },
        { id: 'py-3', type: 'code', skill: 'python_code_write', difficulty: 2, prompt: 'Создай total_income как произведение shifts и pay_per_shift, затем выведи результат.', starter: 'shifts = 3\npay_per_shift = 4200\n\n# продолжи программу\n', tests: [{ name: 'Создана total_income', expression: "'total_income' in globals()" }, { name: 'Расчёт равен 12600', expression: 'total_income == 12600' }, { name: 'Результат выведен', expression: "'12600' in __academy_output" }], hints: ['Используй умножение.', 'total_income = shifts * pay_per_shift', 'Заверши print(total_income).'], explanation: 'Рабочее решение хранит исходные данные, отдельно вычисляет результат и выводит его.' },
        { id: 'py-4', type: 'text', skill: 'python_assignment', difficulty: 2, prompt: 'После каких строк значение x равно 9?\n1) x = 5\n2) x = x + 4\n3) x = x * 2', accepted: ['2', 'после 2', 'после второй'], hints: ['Проследи значение после каждой строки.'], explanation: 'После второй строки x равно 9; после третьей — 18.' },
        { id: 'py-5', type: 'code', skill: 'python_code_write', difficulty: 2, prompt: 'Цена поездки 780 рублей, поездок 5. Создай trip_price, trip_count и total_cost. Выведи: Общая стоимость: 3900', starter: '# напиши программу\n', tests: [{ name: 'trip_price равно 780', expression: 'trip_price == 780' }, { name: 'trip_count равно 5', expression: 'trip_count == 5' }, { name: 'total_cost равно 3900', expression: 'total_cost == 3900' }, { name: 'Вывод подписан', expression: "'Общая стоимость:' in __academy_output and '3900' in __academy_output" }], hints: ['Сначала две исходные переменные.', 'total_cost = trip_price * trip_count'], explanation: 'Это перенос той же структуры на новую предметную ситуацию.' },
        { id: 'py-6', type: 'text', skill: 'python_output_prediction', difficulty: 3, prompt: 'Что выведет код?\n\nx = 3\ny = x\nx = 8\nprint(y, x)', accepted: ['3 8', '3, 8', '3 и 8'], hints: ['y сохраняет число, а не живую связь с x.'], explanation: 'Вывод: 3 8. Присваивание копирует текущее значение.' },
        { id: 'py-7', type: 'code', skill: 'python_code_write', difficulty: 3, prompt: 'Исправь программу так, чтобы она вывела 25.', starter: 'number = 5\nsquare = number + number\nprint(square)\n', tests: [{ name: 'square равен 25', expression: 'square == 25' }, { name: 'Вывод 25', expression: "'25' in __academy_output" }], hints: ['Квадрат — это число, умноженное само на себя.'], explanation: 'Нужно использовать number * number.' },
        { id: 'py-8', type: 'choice', skill: 'python_execution_order', difficulty: 3, prompt: 'Какая строка сначала вычисляет выражение справа, а затем сохраняет результат слева?', options: ['x == x + 1', 'x = x + 1', 'print(x + 1)'], correctOption: 'x = x + 1', hints: ['Один знак = — присваивание.'], explanation: 'В Python один знак = выполняет присваивание.' },
        { id: 'py-9', type: 'code', skill: 'python_code_write', difficulty: 4, prompt: 'Создай переменные hours=7 и rate=650, вычисли salary. Если использовать только изученные операции, просто выведи salary.', starter: 'hours = 7\nrate = 650\n', tests: [{ name: 'salary создана', expression: "'salary' in globals()" }, { name: 'salary равна 4550', expression: 'salary == 4550' }, { name: 'salary выведена', expression: "'4550' in __academy_output" }], hints: ['Структура та же: данные → вычисление → вывод.'], explanation: 'Программа подтверждает перенос навыка без копирования конкретных имён.' },
        { id: 'py-10', type: 'text', skill: 'python_output_prediction', difficulty: 4, prompt: 'Что выведет код?\n\na = 10\na = a - 3\na = a * 2\nprint(a)', numeric: 14, tolerance: 0, hints: ['После каждой строки записывай новое значение.'], explanation: '10 → 7 → 14.' }
      ]
    }
  },
  {
    slug: 'english-foundations-1', subject: 'english', title: 'Английский язык', shortTitle: 'English', description: 'Базовый порядок слов, be, артикли, местоимения и понимание коротких фраз.', accent: 'green',
    definition: {
      promise: 'Ты соберёшь первые правильные английские предложения и научишься замечать типичные ошибки русскоязычного начинающего.',
      skills: [{ slug: 'en_be', title: 'Глагол be', baseline: 10 }, { slug: 'en_word_order', title: 'Порядок слов', baseline: 10 }, { slug: 'en_articles', title: 'Артикли', baseline: 5 }, { slug: 'en_comprehension', title: 'Понимание фраз', baseline: 10 }],
      tasks: [
        { id: 'en-1', type: 'choice', skill: 'en_be', difficulty: 1, prompt: 'Выбери правильный вариант: I ___ tired.', options: ['am', 'is', 'are'], correctOption: 'am', hints: ['С местоимением I используется особая форма.'], explanation: 'Правильно: I am tired.' },
        { id: 'en-2', type: 'choice', skill: 'en_be', difficulty: 1, prompt: 'She ___ a doctor.', options: ['am', 'is', 'are'], correctOption: 'is', hints: ['She — третье лицо единственного числа.'], explanation: 'Правильно: She is a doctor.' },
        { id: 'en-3', type: 'text', skill: 'en_word_order', difficulty: 1, prompt: 'Собери предложение: student / I / am / a', accepted: ['i am a student', 'I am a student.'], hints: ['Начни с подлежащего I.'], explanation: 'Базовый порядок: подлежащее + глагол + дополнение: I am a student.' },
        { id: 'en-4', type: 'choice', skill: 'en_articles', difficulty: 2, prompt: 'Выбери: This is ___ apple.', options: ['a', 'an', 'the'], correctOption: 'an', hints: ['Следующее слово начинается с гласного звука.'], explanation: 'Перед apple используется an.' },
        { id: 'en-5', type: 'text', skill: 'en_comprehension', difficulty: 2, prompt: 'Переведи на русский: We work at night.', allKeywords: ['мы', 'работ', 'ноч'], hints: ['at night = ночью.'], explanation: 'Мы работаем ночью.' },
        { id: 'en-6', type: 'choice', skill: 'en_word_order', difficulty: 2, prompt: 'Какой вопрос составлен правильно?', options: ['You are ready?', 'Are you ready?', 'Ready are you?'], correctOption: 'Are you ready?', hints: ['В вопросе форма be ставится перед подлежащим.'], explanation: 'Правильно: Are you ready?' },
        { id: 'en-7', type: 'text', skill: 'en_be', difficulty: 2, prompt: 'Сделай отрицание: He is busy.', accepted: ['he is not busy', "he isn't busy", 'He is not busy.'], hints: ['Добавь not после is.'], explanation: 'He is not busy / He isn’t busy.' },
        { id: 'en-8', type: 'choice', skill: 'en_articles', difficulty: 3, prompt: 'Выбери: I have ___ car. ___ car is old.', options: ['a / The', 'the / A', 'an / The'], correctOption: 'a / The', hints: ['Первое упоминание — неопределённое, повторное — определённое.'], explanation: 'I have a car. The car is old.' },
        { id: 'en-9', type: 'text', skill: 'en_word_order', difficulty: 3, prompt: 'Переведи: «Они не дома».', accepted: ["they aren't at home", 'they are not at home', "They aren't home.", 'They are not home.'], hints: ['Они = they, форма be = are.'], explanation: 'They are not at home.' },
        { id: 'en-10', type: 'choice', skill: 'en_comprehension', difficulty: 3, prompt: 'Фраза “I am on my way” чаще всего означает:', options: ['Я потерял дорогу', 'Я уже в пути', 'Я стою на дороге'], correctOption: 'Я уже в пути', hints: ['Это устойчивая разговорная фраза.'], explanation: 'I am on my way = Я уже в пути / Я еду.' },
        { id: 'en-11', type: 'text', skill: 'en_word_order', difficulty: 4, prompt: 'Исправь ошибку: She are my friend.', accepted: ['she is my friend', 'She is my friend.'], hints: ['С she нужна форма is.'], explanation: 'She is my friend.' },
        { id: 'en-12', type: 'text', skill: 'en_comprehension', difficulty: 4, prompt: 'Ответь по-английски полным предложением: Are you tired?', anyKeywords: ['i am', "i'm", 'i am not', "i'm not"], hints: ['Начни с Yes, I am или No, I am not.'], explanation: 'Подходят, например: Yes, I am. / No, I am not.' }
      ]
    }
  },
  {
    slug: 'russian-foundations-1', subject: 'russian', title: 'Русский язык', shortTitle: 'Русский', description: 'Орфография, пунктуация, смысловые связи и точность формулировки.', accent: 'orange',
    definition: {
      promise: 'Ты потренируешь не запоминание правил в отрыве, а применение: заметить смысловую связь, выбрать написание и объяснить знак.',
      skills: [{ slug: 'ru_spelling', title: 'Орфография', baseline: 10 }, { slug: 'ru_punctuation', title: 'Пунктуация', baseline: 10 }, { slug: 'ru_grammar', title: 'Грамматика', baseline: 10 }, { slug: 'ru_meaning', title: 'Точность смысла', baseline: 10 }],
      tasks: [
        { id: 'ru-1', type: 'choice', skill: 'ru_spelling', difficulty: 1, prompt: 'Выбери правильное написание.', options: ['интелегентный', 'интеллигентный', 'интеллигентный'], correctOption: 'интеллигентный', hints: ['В слове две л, но одна г.'], explanation: 'Правильно: интеллигентный.' },
        { id: 'ru-2', type: 'choice', skill: 'ru_grammar', difficulty: 1, prompt: 'Выбери правильную форму: согласно ___', options: ['расписания', 'расписанию', 'с расписанием'], correctOption: 'расписанию', hints: ['Предлог «согласно» требует дательного падежа.'], explanation: 'Правильно: согласно расписанию.' },
        { id: 'ru-3', type: 'text', skill: 'ru_punctuation', difficulty: 1, prompt: 'Расставь знак: Когда закончилась смена мы поехали домой.', accepted: ['Когда закончилась смена, мы поехали домой.', 'когда закончилась смена, мы поехали домой'], hints: ['Придаточная часть отделяется от главной.'], explanation: 'После слова «смена» нужна запятая.' },
        { id: 'ru-4', type: 'choice', skill: 'ru_spelling', difficulty: 2, prompt: 'Выбери: Он говорил ___, но убедительно.', options: ['не громко', 'негромко', 'не-громко'], correctOption: 'негромко', hints: ['Слово можно заменить синонимом «тихо», противопоставления с а нет.'], explanation: 'Негромко пишется слитно.' },
        { id: 'ru-5', type: 'choice', skill: 'ru_meaning', difficulty: 2, prompt: 'Какое предложение точнее и короче?', options: ['Я лично сам видел это своими глазами.', 'Я сам это видел.', 'Я видел это лично своими собственными глазами.'], correctOption: 'Я сам это видел.', hints: ['Убери смысловые повторы.'], explanation: '«Я сам это видел» передаёт тот же смысл без плеоназмов.' },
        { id: 'ru-6', type: 'text', skill: 'ru_punctuation', difficulty: 2, prompt: 'Исправь пунктуацию: Я понял что ошибся и решил всё проверить.', accepted: ['Я понял, что ошибся, и решил всё проверить.', 'я понял, что ошибся, и решил всё проверить'], hints: ['Перед союзом что нужна запятая; придаточная часть заканчивается перед и.'], explanation: 'Придаточное «что ошибся» выделяется запятыми.' },
        { id: 'ru-7', type: 'choice', skill: 'ru_grammar', difficulty: 3, prompt: 'Выбери нормативный вариант.', options: ['по приезду домой', 'по приезде домой', 'после приезду домой'], correctOption: 'по приезде домой', hints: ['В значении «после» употребляется предложный падеж.'], explanation: 'Нормативно: по приезде домой.' },
        { id: 'ru-8', type: 'choice', skill: 'ru_spelling', difficulty: 3, prompt: 'Где пишется НН?', options: ['жаре__ая картошка', 'краше__ый забор', 'ране__ый солдат без зависимых слов'], correctOption: 'краше__ый забор', hints: ['Полное страдательное причастие с приставкой обычно имеет НН.'], explanation: 'Крашенный забор — НН. В остальных данных формах возможно одно Н по контексту.' },
        { id: 'ru-9', type: 'text', skill: 'ru_meaning', difficulty: 3, prompt: 'Устрани двусмысленность: «Проводник встретил пассажира в его вагоне». Напиши один однозначный вариант.', anyKeywords: ['своём', 'вагоне пассажира', 'вагоне проводника'], hints: ['Укажи прямо, кому принадлежит вагон.'], explanation: 'Например: «Проводник встретил пассажира в вагоне пассажира» или «…в своём вагоне».' },
        { id: 'ru-10', type: 'choice', skill: 'ru_punctuation', difficulty: 4, prompt: 'Почему нужна запятая: «Я остановился, потому что загорелся красный сигнал»?', options: ['Разделяет однородные члены', 'Отделяет придаточную причину', 'Ставится перед любым потому'], correctOption: 'Отделяет придаточную причину', hints: ['Вторая часть отвечает на вопрос «почему?».'], explanation: 'Союз «потому что» вводит придаточное причины.' },
        { id: 'ru-11', type: 'text', skill: 'ru_spelling', difficulty: 4, prompt: 'Вставь НЕ/НИ: Он ___ разу ___ пожалел о решении.', accepted: ['ни разу не пожалел', 'Он ни разу не пожалел о решении.'], hints: ['НИ усиливает отрицание, которое выражено частицей НЕ при глаголе.'], explanation: 'Правильно: ни разу не пожалел.' },
        { id: 'ru-12', type: 'choice', skill: 'ru_meaning', difficulty: 4, prompt: 'Какое утверждение логически корректно?', options: ['Большинство всегда право.', 'Если факт повторяют часто, он становится истинным.', 'Популярность мнения не доказывает его истинность.'], correctOption: 'Популярность мнения не доказывает его истинность.', hints: ['Отдели число сторонников от качества доказательств.'], explanation: 'Истинность утверждения зависит от оснований, а не от популярности.' }
      ]
    }
  },
  {
    slug: 'math-foundations-1', subject: 'math', title: 'Математика', shortTitle: 'Математика', description: 'Вычисления, порядок действий, дроби, уравнения и количественное рассуждение.', accent: 'cyan',
    definition: {
      promise: 'Ты восстановишь базовые операции и будешь объяснять ход решения, а не только получать число.',
      skills: [{ slug: 'math_arithmetic', title: 'Вычисления', baseline: 15 }, { slug: 'math_order', title: 'Порядок действий', baseline: 10 }, { slug: 'math_equations', title: 'Уравнения', baseline: 5 }, { slug: 'math_reasoning', title: 'Количественное рассуждение', baseline: 10 }],
      tasks: [
        { id: 'ma-1', type: 'text', skill: 'math_order', difficulty: 1, prompt: 'Вычисли: 8 + 3 × 4', numeric: 20, tolerance: 0, hints: ['Умножение выполняется раньше сложения.'], explanation: '3×4=12, затем 8+12=20.' },
        { id: 'ma-2', type: 'text', skill: 'math_arithmetic', difficulty: 1, prompt: 'Вычисли: 72 ÷ 8 + 5', numeric: 14, tolerance: 0, hints: ['Сначала деление.'], explanation: '72÷8=9, затем 9+5=14.' },
        { id: 'ma-3', type: 'text', skill: 'math_equations', difficulty: 1, prompt: 'Реши уравнение: x + 7 = 19', numeric: 12, tolerance: 0, hints: ['Вычти 7 из обеих частей.'], explanation: 'x=12.' },
        { id: 'ma-4', type: 'text', skill: 'math_arithmetic', difficulty: 2, prompt: 'Сколько составляет 3/4 от 40?', numeric: 30, tolerance: 0, hints: ['Сначала раздели 40 на 4, затем умножь на 3.'], explanation: '40÷4×3=30.' },
        { id: 'ma-5', type: 'text', skill: 'math_reasoning', difficulty: 2, prompt: 'Поезд прошёл 180 км за 3 часа с постоянной скоростью. Какова скорость?', numeric: 60, tolerance: 0, hints: ['Скорость = расстояние ÷ время.'], explanation: '180÷3=60 км/ч.' },
        { id: 'ma-6', type: 'text', skill: 'math_equations', difficulty: 2, prompt: 'Реши: 3x = 27', numeric: 9, tolerance: 0, hints: ['Раздели обе части на 3.'], explanation: 'x=9.' },
        { id: 'ma-7', type: 'text', skill: 'math_order', difficulty: 3, prompt: 'Вычисли: (18 − 6) ÷ 3 + 2²', numeric: 8, tolerance: 0, hints: ['Сначала скобки и степень.'], explanation: '(18−6)=12, 12÷3=4, 2²=4, итог 8.' },
        { id: 'ma-8', type: 'text', skill: 'math_reasoning', difficulty: 3, prompt: 'Цена выросла с 800 до 920 рублей. На сколько процентов?', numeric: 15, tolerance: 0.1, hints: ['Рост 120 рублей. Раздели 120 на исходные 800.'], explanation: '120/800=0,15, то есть 15%.' },
        { id: 'ma-9', type: 'text', skill: 'math_arithmetic', difficulty: 3, prompt: 'Сократи дробь 18/24.', accepted: ['3/4', '0,75', '0.75'], hints: ['Раздели числитель и знаменатель на 6.'], explanation: '18/24 = 3/4.' },
        { id: 'ma-10', type: 'text', skill: 'math_equations', difficulty: 3, prompt: 'Реши: 2x + 5 = 17', numeric: 6, tolerance: 0, hints: ['Сначала вычти 5, затем раздели на 2.'], explanation: '2x=12, x=6.' },
        { id: 'ma-11', type: 'choice', skill: 'math_reasoning', difficulty: 4, prompt: 'Какое число больше?', options: ['0,7', '2/3', 'Они равны'], correctOption: '0,7', hints: ['2/3 примерно равно 0,667.'], explanation: '0,7 больше 2/3.' },
        { id: 'ma-12', type: 'text', skill: 'math_reasoning', difficulty: 4, prompt: 'Работу выполняют 4 человека за 6 часов при одинаковой производительности. Сколько часов потребуется 8 людям?', numeric: 3, tolerance: 0, hints: ['Общий объём — 24 человеко-часа.'], explanation: '24÷8=3 часа.' },
        { id: 'ma-13', type: 'text', skill: 'math_equations', difficulty: 4, prompt: 'Реши: (x − 2)/3 = 5', numeric: 17, tolerance: 0, hints: ['Умножь обе части на 3, затем прибавь 2.'], explanation: 'x−2=15, x=17.' }
      ]
    }
  }
];

export const subjectScenarioMap = Object.fromEntries(subjectScenarios.map((scenario) => [scenario.subject, scenario]));

export function buildAdaptivePlan(scenario, minutes, energy) {
  const countByMinutes = { 15: 3, 30: 5, 45: 7, 60: 9, 75: 11, 90: 13 };
  const nearest = [15, 30, 45, 60, 75, 90].reduce((best, value) => Math.abs(value - minutes) < Math.abs(best - minutes) ? value : best, 30);
  const baseCount = countByMinutes[nearest];
  const adjustment = energy <= 3 ? -1 : energy >= 8 ? 1 : 0;
  const targetCount = Math.max(3, Math.min(scenario.definition.tasks.length, baseCount + adjustment));
  const ceiling = energy <= 3 ? 2 : energy <= 7 ? 4 : 5;
  const tasks = scenario.definition.tasks;
  const core = tasks.filter((task) => task.difficulty <= ceiling);
  const stretch = tasks.filter((task) => task.difficulty > ceiling);
  const selected = [];
  const skillSeen = new Set();

  for (const task of core) {
    if (!skillSeen.has(task.skill) && selected.length < targetCount) {
      selected.push(task);
      skillSeen.add(task.skill);
    }
  }
  for (const task of core) {
    if (!selected.includes(task) && selected.length < targetCount) selected.push(task);
  }
  if (energy >= 8) {
    for (const task of stretch) {
      if (selected.length < targetCount) selected.push(task);
    }
  }
  for (const task of tasks) {
    if (!selected.includes(task) && selected.length < targetCount) selected.push(task);
  }

  return {
    tasks: selected.slice(0, targetCount),
    targetCount,
    mode: energy <= 3 ? 'Восстановительный' : energy >= 8 ? 'Глубокий фокус' : 'Рабочий',
    explanationStyle: energy <= 3 ? 'короткие объяснения и больше опор' : energy >= 8 ? 'минимум подсказок и сложный перенос' : 'баланс объяснения и самостоятельности',
    maxDifficulty: Math.max(...selected.slice(0, targetCount).map((task) => task.difficulty))
  };
}
