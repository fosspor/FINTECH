export type DefaultTask = {
  id: number;
  title: string;
  type: "lesson" | "quiz" | "action" | "mini_game";
  crystals: number;
};

export type DefaultLevel = {
  id: number;
  title: string;
  description: string;
  icon_name: string;
  tasks: DefaultTask[];
};

export const DEFAULT_LEVELS: DefaultLevel[] = [
  {
    id: 1,
    title: "Стартовая диагностика",
    description: "FinClip помогает понять, где сейчас деньги, риски и первая точка роста.",
    icon_name: "Sprout",
    tasks: [
      { id: 1, title: "Ответить на 5 вопросов о деньгах", type: "lesson", crystals: 20 },
      { id: 2, title: "Выбрать главную финансовую цель", type: "action", crystals: 30 },
      { id: 3, title: "Получить первую карту пути", type: "quiz", crystals: 25 },
    ],
  },
  {
    id: 2,
    title: "Контроль импульсивных покупок",
    description: "Анти-Импульс учит делать паузу перед покупкой и замечать ловушки.",
    icon_name: "Shield",
    tasks: [
      { id: 1, title: "Распознать 3 покупки-ловушки", type: "mini_game", crystals: 30 },
      { id: 2, title: "Включить правило 24 часов", type: "action", crystals: 40 },
      { id: 3, title: "Найти одну лишнюю подписку", type: "action", crystals: 35 },
    ],
  },
  {
    id: 3,
    title: "Бюджет без боли",
    description: "Калькулятор раскладывает доходы и траты по понятным категориям.",
    icon_name: "Target",
    tasks: [
      { id: 1, title: "Разделить траты на обязательные и свободные", type: "lesson", crystals: 25 },
      { id: 2, title: "Собрать бюджет недели", type: "action", crystals: 45 },
      { id: 3, title: "Пройти квиз по категориям", type: "quiz", crystals: 30 },
    ],
  },
  {
    id: 4,
    title: "Подушка безопасности",
    description: "Копилка Плюша помогает накопить первый резерв без давления.",
    icon_name: "PiggyBank",
    tasks: [
      { id: 1, title: "Посчитать минимальную подушку", type: "lesson", crystals: 25 },
      { id: 2, title: "Отложить первую маленькую сумму", type: "action", crystals: 60 },
      { id: 3, title: "Поймать монеты в мини-игре", type: "mini_game", crystals: 35 },
    ],
  },
  {
    id: 5,
    title: "Кредиты и долги",
    description: "Кредитный Светофор показывает, где красная зона и как снижать переплату.",
    icon_name: "AlertCircle",
    tasks: [
      { id: 1, title: "Понять стоимость кредитки", type: "lesson", crystals: 30 },
      { id: 2, title: "Выбрать стратегию закрытия долга", type: "quiz", crystals: 45 },
      { id: 3, title: "Найти самый дорогой долг", type: "action", crystals: 50 },
    ],
  },
  {
    id: 6,
    title: "Финансовые цели",
    description: "Чек-листик превращает большую цель в маленькие шаги.",
    icon_name: "Target",
    tasks: [
      { id: 1, title: "Сформулировать цель в цифрах", type: "action", crystals: 35 },
      { id: 2, title: "Разбить цель на недели", type: "lesson", crystals: 30 },
      { id: 3, title: "Поставить первую галочку", type: "action", crystals: 45 },
    ],
  },
  {
    id: 7,
    title: "Инвестиции для новичка",
    description: "Инвест-Росток объясняет риск, горизонт и рост капитала простыми словами.",
    icon_name: "TrendingUp",
    tasks: [
      { id: 1, title: "Разобраться с риском и горизонтом", type: "lesson", crystals: 35 },
      { id: 2, title: "Отличить инвестицию от ставки", type: "quiz", crystals: 40 },
      { id: 3, title: "Собрать осторожный стартовый план", type: "action", crystals: 55 },
    ],
  },
  {
    id: 8,
    title: "Привычки и streak",
    description: "Кристалл Бро закрепляет ежедневные действия, награды и серию дней.",
    icon_name: "Zap",
    tasks: [
      { id: 1, title: "Выбрать ежедневное действие на 2 минуты", type: "action", crystals: 30 },
      { id: 2, title: "Сохранить streak", type: "mini_game", crystals: 45 },
      { id: 3, title: "Открыть награду за уровень", type: "action", crystals: 60 },
    ],
  },
];
