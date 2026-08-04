export const fallbackScenario = {
  slug: 'python-variables-investor-mvp',
  title: 'Python: переменные и последовательное выполнение',
  subject: 'programming',
  version: 1,
  definition: {
    lesson_id: '5c863471-378f-410f-8b10-2998c8cd8cac',
    course_id: '2713b923-7af5-478c-8a00-c53a02a8a423',
    promise:
      'За одно занятие ученик научится читать простую программу сверху вниз, отслеживать изменение переменных и писать небольшой расчёт.',
    skills: [
      { slug: 'python_assignment', title: 'Присваивание значения', baseline: 15 },
      { slug: 'python_execution_order', title: 'Последовательное выполнение', baseline: 10 },
      { slug: 'python_output_prediction', title: 'Прогноз результата', baseline: 5 }
    ],
    diagnostic: {
      question: 'Какое число выведет программа?\n\nx = 4\nx = x + 3\nprint(x)',
      accepted: ['7'],
      correct:
        'Верно. Вторая строка берёт старое значение x, прибавляет 3 и сохраняет новый результат обратно в x.',
      incorrect:
        'Здесь важно читать программу сверху вниз. После первой строки x равно 4. Затем выражение справа вычисляется первым: 4 + 3. Получившееся 7 записывается обратно в x.'
    },
    guided: {
      question:
        'Предскажи вывод этой программы, не запуская её:\n\ntrips = 2\npay_per_trip = 6500\ntotal = trips * pay_per_trip\nprint(total)',
      accepted: ['13000', '13 000'],
      hints: [
        'Сначала назови значения двух исходных переменных.',
        'Строка total = trips * pay_per_trip использует умножение.',
        'Вычисли 2 × 6500, затем это значение попадёт в print().'
      ],
      correct: 'Да. total получает 13000, и print выводит именно это число.',
      incorrect:
        'Ответ пока не совпадает. Не пытайся угадать: выполни каждую строку по очереди и запиши состояние переменных.'
    },
    code_task: {
      prompt:
        'Напиши программу, которая хранит количество смен 3 и оплату за смену 4200, вычисляет total_income и печатает результат.',
      starter:
        'shifts = 3\npay_per_shift = 4200\n\n# вычисли total_income и выведи его\n',
      tests: [
        { name: 'Переменная total_income создана', expression: "'total_income' in globals()" },
        { name: 'Расчёт верный', expression: 'total_income == 12600' },
        { name: 'Вывод содержит 12600', expression: "'12600' in __academy_output" }
      ],
      hints: [
        'Используй те же три шага: исходные данные → вычисление → вывод.',
        'Формула: total_income = shifts * pay_per_shift.',
        'Последняя строка должна вызвать print(total_income).'
      ]
    },
    transfer: {
      prompt:
        'Самостоятельная задача. Цена одной поездки — 780 рублей, поездок — 5. Создай переменные trip_price и trip_count, вычисли total_cost и выведи строку: Общая стоимость: 3900',
      starter: '# Реши без копирования предыдущего ответа\n',
      tests: [
        { name: 'trip_price равно 780', expression: 'trip_price == 780' },
        { name: 'trip_count равно 5', expression: 'trip_count == 5' },
        { name: 'total_cost равно 3900', expression: 'total_cost == 3900' },
        {
          name: 'Вывод подписан',
          expression: "'Общая стоимость:' in __academy_output and '3900' in __academy_output"
        }
      ],
      hints: [
        'Определи три переменные: две исходные и одну вычисляемую.',
        'total_cost должен быть произведением количества и цены.'
      ]
    }
  }
};
