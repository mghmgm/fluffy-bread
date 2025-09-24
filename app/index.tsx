/**
 * ИГРА FLUFFY BREAD
 * 
 * Основной компонент игры, реализованный с использованием:
 * - React Native Skia для высокопроизводительного рендеринга 2D графики
 * - React Native Reanimated для плавных анимаций
 * - React Native Gesture Handler для обработки касаний
 * 
 * Архитектура:
 * - Физика птицы: гравитация + прыжок по касанию
 * - Система препятствий: трубы с случайным расположением
 * - Система подсчета очков: прохождение через трубы
 * - Обнаружение столкновений: проверка пересечений с препятствиями
 */

// Импорты React Native для базовой функциональности
import { Platform, useWindowDimensions } from 'react-native';

// Импорты Skia для рендеринга 2D графики
import {
    Canvas, // Компонент для отображения изображений
    Group, // Хук для загрузки изображений
    Image, // Группировка элементов для трансформаций
    Text, // Компонент для отображения текста
    matchFont, // Основной холст для рисования
    useImage, // Хук для загрузки изображений
} from '@shopify/react-native-skia';

// Импорты Reanimated для анимаций и работы с shared values
import {
    Easing, // Интерполяция значений
    Extrapolation, // Выполнение JS кода из worklet
    cancelAnimation, // Вычисляемые значения на основе других
    interpolate, // Реакция на изменения значений
    runOnJS, // Экстраполяция за границами
    useAnimatedReaction, // Колбэк для каждого кадра
    useDerivedValue, // Повторяющиеся анимации
    useFrameCallback,
    useSharedValue, // Функции плавности анимации
    withSequence, // Создание анимируемых значений
    withTiming
} from 'react-native-reanimated';

// Импорты React хуков
import { useEffect, useState } from 'react';

// Импорты для обработки жестов
import {
    Gesture, // Корневой компонент для жестов
    GestureDetector,
    GestureHandlerRootView, // Корневой компонент для жестов
} from 'react-native-gesture-handler';

// ==================== КОНСТАНТЫ ИГРЫ ====================

/**
 * Физические константы игры
 */
const GRAVITY = 1000;        // Сила гравитации (пиксели/сек²)
const JUMP_FORCE = -500;     // Сила прыжка (отрицательная = вверх)

/**
 * Размеры игровых объектов
 */
const pipeWidth = 104;       // Ширина трубы
const pipeHeight = 640;      // Высота трубы

// ==================== ОСНОВНОЙ КОМПОНЕНТ ====================

/**
 * App - главный компонент игры Flappy Bird
 * 
 * Управляет:
 * - Состоянием игры (очки, позиция птицы, препятствия)
 * - Физикой (гравитация, прыжки)
 * - Анимациями (движение труб, поворот птицы)
 * - Обнаружением столкновений
 * - Обработкой пользовательского ввода
 */
const App = () => {
  // Получаем размеры экрана для адаптивности
  const { width, height } = useWindowDimensions();
  
  // Состояние счета (React state для UI)
  const [score, setScore] = useState(0);

  // ==================== ЗАГРУЗКА ИЗОБРАЖЕНИЙ ====================
  
  /**
   * Загрузка всех спрайтов игры с помощью Skia useImage
   * Изображения кэшируются и оптимизируются для рендеринга
   */
  const bg = useImage(require('../assets/sprites/background-day.png'));           // Фон игры
  const bird = useImage(require('../assets/sprites/yellowbird-upflap.png'));     // Спрайт птицы
  const pipeBottom = useImage(require('../assets/sprites/pipe-green.png'));      // Нижняя труба
  const pipeTop = useImage(require('../assets/sprites/pipe-green-top.png'));     // Верхняя труба
  const base = useImage(require('../assets/sprites/base.png'));                  // Земля/основание

  // ==================== СОСТОЯНИЕ ИГРЫ (SHARED VALUES) ====================
  
  /**
   * Shared Values - анимируемые значения, которые работают на UI потоке
   * Обеспечивают плавную анимацию 60 FPS без блокировки JS потока
   */
  
  // Состояние игры
  const gameOver = useSharedValue(false);        // Флаг окончания игры
  
  // Позиция и движение труб
  const pipeX = useSharedValue(width);           // Горизонтальная позиция труб (начинаем за экраном)
  
  // Позиция и физика птицы
  const birdY = useSharedValue(height / 3);      // Вертикальная позиция птицы (1/3 от высоты экрана)
  const birdX = width / 4;                       // Горизонтальная позиция птицы (1/4 от ширины экрана)
  const birdYVelocity = useSharedValue(0);       // Скорость птицы по Y (гравитация + прыжки)

  // ==================== ВЫЧИСЛЯЕМЫЕ ЗНАЧЕНИЯ ====================
  
  /**
   * Вычисляемые значения на основе других shared values
   * Автоматически пересчитываются при изменении зависимостей
   */
  
  // Случайное смещение для создания разной высоты прохода между трубами
  const pipeOffset = useSharedValue(0);
  
  // Позиции верхней и нижней труб на основе смещения
  const topPipeY = useDerivedValue(() => pipeOffset.value - 320);                    // Верхняя труба
  const bottomPipeY = useDerivedValue(() => height - 320 + pipeOffset.value);       // Нижняя труба

  // ==================== СИСТЕМА СКОРОСТИ ====================
  
  /**
   * Динамическая скорость движения труб
   * Увеличивается с ростом счета для усложнения игры
   */
  const pipesSpeed = useDerivedValue(() => {
    return interpolate(score, [0, 20], [1, 2]);  // От 1x до 2x скорости при 20 очках
  });

  // ==================== СИСТЕМА ПРЕПЯТСТВИЙ ====================
  
  /**
   * Массив препятствий для обнаружения столкновений
   * Содержит координаты и размеры всех труб
   */
  const obstacles = useDerivedValue(() => [
    // Нижняя труба
    {
      x: pipeX.value,           // Горизонтальная позиция
      y: bottomPipeY.value,     // Вертикальная позиция
      h: pipeHeight,            // Высота
      w: pipeWidth,             // Ширина
    },
    // Верхняя труба
    {
      x: pipeX.value,           // Горизонтальная позиция
      y: topPipeY.value,        // Вертикальная позиция
      h: pipeHeight,            // Высота
      w: pipeWidth,             // Ширина
    },
  ]);

  // ==================== ИНИЦИАЛИЗАЦИЯ ИГРЫ ====================
  
  /**
   * Запуск игры при монтировании компонента
   */
  useEffect(() => {
    moveTheMap();  // Начинаем движение труб
  }, []);

  // ==================== СИСТЕМА ДВИЖЕНИЯ ТРУБ ====================
  
  /**
   * moveTheMap - анимация движения труб слева направо
   * 
   * Логика:
   * 1. Трубы начинают за правым краем экрана (width)
   * 2. Движутся к левому краю (-150) с линейной скоростью
   * 3. Скорость зависит от текущего счета (pipesSpeed)
   * 4. После завершения анимации трубы возвращаются за экран
   */
  const moveTheMap = () => {
    pipeX.value = withSequence(
      withTiming(width, { duration: 0 }),        // Мгновенно перемещаем за экран
      withTiming(-150, {                         // Анимируем движение через экран
        duration: 3000 / pipesSpeed.value,       // Длительность зависит от скорости
        easing: Easing.linear,                   // Линейное движение
      }),
      withTiming(width, { duration: 0 })         // Мгновенно возвращаем за экран
    );
  };

  // ==================== СИСТЕМА ПОДСЧЕТА ОЧКОВ ====================
  
  /**
   * useAnimatedReaction - отслеживает изменения позиции труб
   * Выполняется на UI потоке для плавной работы
   */
  useAnimatedReaction(
    () => pipeX.value,  // Отслеживаем позицию труб
    (currentValue, previousValue) => {
      const middle = birdX;  // Позиция птицы (центр для подсчета очков)

      // ========== ГЕНЕРАЦИЯ НОВЫХ ПРЕПЯТСТВИЙ ==========
      
      /**
       * Когда трубы проходят за левый край экрана (-100),
       * генерируем новое случайное смещение для следующего препятствия
       */
      if (previousValue && currentValue < -100 && previousValue > -100) {
        pipeOffset.value = Math.random() * 400 - 200;  // Случайное смещение от -200 до +200
        cancelAnimation(pipeX);                         // Отменяем текущую анимацию
        runOnJS(moveTheMap)();                         // Запускаем новую анимацию
      }

      // ========== ПОДСЧЕТ ОЧКОВ ==========
      
      /**
       * Очки начисляются когда птица проходит через трубы
       * Проверяем пересечение позиции птицы с позицией труб
       */
      if (
        currentValue !== previousValue &&  // Позиция изменилась
        previousValue &&                   // Есть предыдущее значение
        currentValue <= middle &&          // Трубы прошли через птицу
        previousValue > middle             // Ранее трубы были справа от птицы
      ) {
        runOnJS(setScore)(score + 1);      // Увеличиваем счет на 1
      }
    }
  );

  // ==================== СИСТЕМА ОБНАРУЖЕНИЯ СТОЛКНОВЕНИЙ ====================
  
  /**
   * isPointCollidingWithRect - проверяет столкновение точки с прямоугольником
   * 
   * @param point - объект с координатами {x, y}
   * @param rect - объект с координатами и размерами {x, y, w, h}
   * @returns true если точка находится внутри прямоугольника
   * 
   * 'worklet' - директива для выполнения на UI потоке
   */
  const isPointCollidingWithRect = (point, rect) => {
    'worklet';
    return (
      point.x >= rect.x &&              // Точка справа от левого края И
      point.x <= rect.x + rect.w &&     // Точка слева от правого края И
      point.y >= rect.y &&              // Точка ниже верхнего края И
      point.y <= rect.y + rect.h        // Точка выше нижнего края
    );
  };

  /**
   * useAnimatedReaction - отслеживает изменения позиции птицы
   * Проверяет столкновения с препятствиями и границами экрана
   */
  useAnimatedReaction(
    () => birdY.value,  // Отслеживаем вертикальную позицию птицы
    (currentValue, previousValue) => {
      // Центр птицы для более точного обнаружения столкновений
      const center = {
        x: birdX + 32,      // Центр по X (птица 64px ширина, центр на 32px)
        y: birdY.value + 24, // Центр по Y (птица 48px высота, центр на 24px)
      };

      // ========== ПРОВЕРКА СТОЛКНОВЕНИЙ С ГРАНИЦАМИ ЭКРАНА ==========
      
      /**
       * Столкновение с землей или потолком
       * height - 100: оставляем 100px для земли
       * < 0: столкновение с потолком
       */
      if (currentValue > height - 100 || currentValue < 0) {
        gameOver.value = true;  // Завершаем игру
      }

      // ========== ПРОВЕРКА СТОЛКНОВЕНИЙ С ТРУБАМИ ==========
      
      /**
       * Проверяем столкновение центра птицы с любым препятствием
       * some() возвращает true если хотя бы одно препятствие пересекается
       */
      const isColliding = obstacles.value.some((rect) =>
        isPointCollidingWithRect(center, rect)
      );
      
      if (isColliding) {
        gameOver.value = true;  // Завершаем игру при столкновении
      }
    }
  );

  /**
   * useAnimatedReaction - отслеживает состояние окончания игры
   * Останавливает анимацию труб при завершении игры
   */
  useAnimatedReaction(
    () => gameOver.value,  // Отслеживаем флаг окончания игры
    (currentValue, previousValue) => {
      // Если игра только что закончилась (была false, стала true)
      if (currentValue && !previousValue) {
        cancelAnimation(pipeX);  // Останавливаем движение труб
      }
    }
  );

  // ==================== ФИЗИЧЕСКИЙ ДВИЖАТЕЛЬ ====================
  
  /**
   * useFrameCallback - вызывается каждый кадр (60 FPS)
   * Реализует физику птицы: гравитацию и движение
   * 
   * @param dt - время с предыдущего кадра в миллисекундах
   */
  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    // Не обновляем физику если нет времени или игра окончена
    if (!dt || gameOver.value) {
      return;
    }
    
    // ========== ФИЗИКА ДВИЖЕНИЯ ==========
    
    /**
     * Обновляем позицию птицы на основе скорости
     * Скорость * время = расстояние
     */
    birdY.value = birdY.value + (birdYVelocity.value * dt) / 1000;
    
    /**
     * Применяем гравитацию к скорости
     * Гравитация * время = изменение скорости
     */
    birdYVelocity.value = birdYVelocity.value + (GRAVITY * dt) / 1000;
  });

  // ==================== СИСТЕМА ПЕРЕЗАПУСКА ИГРЫ ====================
  
  /**
   * restartGame - сбрасывает игру к начальному состоянию
   * Выполняется на UI потоке ('worklet')
   */
  const restartGame = () => {
    'worklet';
    
    // ========== СБРОС ПОЗИЦИИ И ФИЗИКИ ПТИЦЫ ==========
    birdY.value = height / 3;        // Возвращаем птицу в начальную позицию
    birdYVelocity.value = 0;         // Сбрасываем скорость
    
    // ========== СБРОС СОСТОЯНИЯ ИГРЫ ==========
    gameOver.value = false;          // Снимаем флаг окончания игры
    pipeX.value = width;             // Возвращаем трубы за экран
    
    // ========== ЗАПУСК НОВОЙ ИГРЫ ==========
    runOnJS(moveTheMap)();           // Запускаем движение труб
    runOnJS(setScore)(0);            // Сбрасываем счет
  };

  // ==================== СИСТЕМА ОБРАБОТКИ ЖЕСТОВ ====================
  
  /**
   * gesture - обработчик касаний экрана
   * 
   * Логика:
   * - Если игра окончена: перезапуск
   * - Если игра идет: прыжок птицы
   */
  const gesture = Gesture.Tap().onStart(() => {
    if (gameOver.value) {
      // ========== ПЕРЕЗАПУСК ИГРЫ ==========
      restartGame();
    } else {
      // ========== ПРЫЖОК ПТИЦЫ ==========
      birdYVelocity.value = JUMP_FORCE;  // Придаем птице импульс вверх
    }
  });

  // ==================== АНИМАЦИЯ ПТИЦЫ ====================
  
  /**
   * birdTransform - вычисляет поворот птицы на основе скорости
   * Птица наклоняется вниз при падении и вверх при подъеме
   */
  const birdTransform = useDerivedValue(() => {
    return [
      {
        rotate: interpolate(
          birdYVelocity.value,    // Скорость птицы
          [-500, 500],           // Диапазон скоростей
          [-0.5, 0.5],           // Диапазон поворота в радианах
          Extrapolation.CLAMP    // Ограничиваем значения
        ),
      },
    ];
  });
  
  /**
   * birdOrigin - точка поворота птицы (центр спрайта)
   * Используется для корректного поворота вокруг центра
   */
  const birdOrigin = useDerivedValue(() => {
    return { 
      x: width / 4 + 32,    // Центр по X (позиция + половина ширины)
      y: birdY.value + 24   // Центр по Y (позиция + половина высоты)
    };
  });

  // ==================== НАСТРОЙКА ШРИФТА ====================
  
  /**
   * Настройка шрифта для отображения счета
   * Использует разные шрифты для iOS и Android
   */
  const fontFamily = Platform.select({ 
    ios: 'Helvetica',      // iOS шрифт
    default: 'serif'       // Android шрифт
  });
  
  const fontStyle = {
    fontFamily,
    fontSize: 40,          // Размер шрифта
    fontWeight: 'bold',    // Жирный шрифт
  };
  
  const font = matchFont(fontStyle);  // Создаем объект шрифта для Skia

  // ==================== РЕНДЕРИНГ ИГРЫ ====================
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={gesture}>
        <Canvas style={{ width, height }}>
          
          {/* ========== ФОН ИГРЫ ========== */}
          <Image 
            image={bg} 
            width={width} 
            height={height} 
            fit={'cover'} 
          />

          {/* ========== ПРЕПЯТСТВИЯ (ТРУБЫ) ========== */}
          
          {/* Верхняя труба */}
          <Image
            image={pipeTop}
            y={topPipeY}        // Динамическая позиция Y
            x={pipeX}           // Динамическая позиция X
            width={pipeWidth}
            height={pipeHeight}
          />
          
          {/* Нижняя труба */}
          <Image
            image={pipeBottom}
            y={bottomPipeY}     // Динамическая позиция Y
            x={pipeX}           // Динамическая позиция X
            width={pipeWidth}
            height={pipeHeight}
          />

          {/* ========== ЗЕМЛЯ/ОСНОВАНИЕ ========== */}
          <Image
            image={base}
            width={width}       // На всю ширину экрана
            height={150}        // Фиксированная высота
            y={height - 75}     // Позиция снизу экрана
            x={0}
            fit={'cover'}
          />

          {/* ========== ПТИЦА ========== */}
          <Group transform={birdTransform} origin={birdOrigin}>
            <Image 
              image={bird} 
              y={birdY}          // Динамическая позиция Y
              x={birdX}          // Фиксированная позиция X
              width={64} 
              height={48} 
            />
          </Group>

          {/* ========== СЧЕТ ========== */}
          <Text
            x={width / 2 - 30}  // Центрирование по горизонтали
            y={100}             // Фиксированная позиция сверху
            text={score.toString()}
            font={font}
          />
          
        </Canvas>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};
export default App;
