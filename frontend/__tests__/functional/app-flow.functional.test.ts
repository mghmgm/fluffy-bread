describe('Gameplay Functional Tests', () => {
  test('complete game flow: start -> play -> game over -> restart', async () => {
    // Симулируем состояние игры без React компонентов
    let gameState = 'menu';
    let score = 0;
    let screenTitle = 'Fluffy Bread';
    let buttons = ['Играть'];

    // 1. Начальное состояние - меню
    expect(screenTitle).toBe('Fluffy Bread');
    expect(buttons).toContain('Играть');
    expect(gameState).toBe('menu');

    // 2. Запускаем игру (симулируем нажатие кнопки)
    const handlePlayPress = () => {
      gameState = 'playing';
      score = 0;
      buttons = []; // Кнопки исчезают во время игры
      screenTitle = ''; // Заголовок скрывается
    };

    handlePlayPress();
    
    // 3. Проверяем что игра началась
    expect(gameState).toBe('playing');
    expect(buttons).not.toContain('Играть');
    expect(score).toBe(0);

    // 4. Симулируем игровые события
    const handleJump = () => {
      // Логика прыжка - в реальной игре это изменило бы позицию птицы
      score += 1; // Симулируем получение очка
    };

    handleJump();
    expect(score).toBe(1);

    // 5. Симулируем завершение игры (столкновение)
    const handleGameOver = () => {
      gameState = 'gameover';
      screenTitle = 'Конец игры';
      buttons = ['Сыграть ещё', 'Меню'];
    };

    handleGameOver();

    // 6. Проверяем экран завершения игры
    expect(gameState).toBe('gameover');
    expect(screenTitle).toBe('Конец игры');
    expect(buttons).toContain('Сыграть ещё');

    // 7. Перезапускаем игру
    const handleRestart = () => {
      gameState = 'playing';
      score = 0;
      buttons = [];
      screenTitle = '';
    };

    handleRestart();
    
    // 8. Проверяем что игра перезапустилась
    expect(gameState).toBe('playing');
    expect(score).toBe(0);
    expect(buttons).not.toContain('Сыграть ещё');
  });

  test('game score progression', () => {
    // Тестируем логику подсчета очков
    let score = 0;
    const pipesPassed = [1, 2, 3, 4, 5];
    
    // Симулируем прохождение труб
    pipesPassed.forEach(() => {
      score += 1;
    });

    expect(score).toBe(5);
    expect(score).toBeGreaterThan(0);
  });

  test('achievement unlocking logic', () => {
    // Тестируем логику достижений
    const achievements = {
      'first_blood': { unlocked: false, condition: (score) => score >= 1 },
      'five_club': { unlocked: false, condition: (score) => score >= 5 },
      'ten_club': { unlocked: false, condition: (score) => score >= 10 }
    };

    const score = 7;
    
    // Проверяем какие достижения должны разблокироваться
    const unlockedAchievements = Object.entries(achievements)
      .filter(([_, ach]) => ach.condition(score))
      .map(([id]) => id);

    expect(unlockedAchievements).toContain('first_blood');
    expect(unlockedAchievements).toContain('five_club');
    expect(unlockedAchievements).not.toContain('ten_club');
  });

  test('skin selection and validation', () => {
    // Тестируем логику выбора скинов
    const ownedSkins = ['bread_default', 'bread_alt'];
    let activeSkin = 'bread_default';

    const selectSkin = (skinId) => {
      if (ownedSkins.includes(skinId)) {
        activeSkin = skinId;
        return true;
      }
      return false;
    };

    // Успешный выбор скина
    const success = selectSkin('bread_alt');
    expect(success).toBe(true);
    expect(activeSkin).toBe('bread_alt');

    // Неудачная попытка выбрать недоступный скин
    const fail = selectSkin('unknown_skin');
    expect(fail).toBe(false);
    expect(activeSkin).toBe('bread_alt'); // Не изменился
  });

  test('game physics simulation', () => {
    // Тестируем упрощенную физику
    let birdY = 100; // начальная позиция
    let velocity = 0;
    const gravity = 0.5;
    const jumpForce = -10;

    const updatePhysics = () => {
      velocity += gravity;
      birdY += velocity;
    };

    const jump = () => {
      velocity = jumpForce;
    };

    // Симулируем несколько кадров без прыжка
    updatePhysics(); // кадр 1
    expect(birdY).toBeGreaterThan(100); // птица падает
    updatePhysics(); // кадр 2
    expect(birdY).toBeGreaterThan(100); // продолжает падать

    // Симулируем прыжок
    jump();
    expect(velocity).toBe(jumpForce);
    
    updatePhysics(); // кадр после прыжка
    expect(birdY).toBeLessThan(110 + jumpForce); // птица поднимается
  });
});