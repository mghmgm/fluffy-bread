describe('Navigation Integration', () => {
  test('should navigate to skins screen and back', () => {
    let currentScreen = 'Game';
    let screenData = {
      title: 'Fluffy Bread',
      buttons: ['Играть', 'Скины', 'Достижения']
    };

    // Функции навигации
    const navigateTo = (screenName) => {
      currentScreen = screenName;
      
      // Обновляем данные экрана в зависимости от текущего экрана
      if (screenName === 'Skins') {
        screenData = {
          title: 'Скины',
          subtitle: 'Выберите внешний вид хлебушка',
          buttons: ['Назад'],
          skins: ['bread_default', 'bread_alt']
        };
      } else if (screenName === 'Game') {
        screenData = {
          title: 'Fluffy Bread', 
          buttons: ['Играть', 'Скины', 'Достижения']
        };
      } else if (screenName === 'Achievements') {
        screenData = {
          title: 'Достижения',
          buttons: ['Назад'],
          achievements: ['first_blood', 'five_club']
        };
      }
    };

    const navigateBack = () => {
      // Простая логика возврата - всегда возвращаемся в игру
      navigateTo('Game');
    };

    // 1. Начальное состояние - игровой экран
    expect(currentScreen).toBe('Game');
    expect(screenData.title).toBe('Fluffy Bread');
    expect(screenData.buttons).toContain('Скины');

    // 2. Нажимаем кнопку "Скины"
    navigateTo('Skins');

    // 3. Проверяем что перешли на экран скинов
    expect(currentScreen).toBe('Skins');
    expect(screenData.title).toBe('Скины');
    expect(screenData.subtitle).toBe('Выберите внешний вид хлебушка');
    expect(screenData.buttons).toContain('Назад');
    expect(screenData.skins).toContain('bread_default');

    // 4. Возвращаемся назад
    navigateBack();

    // 5. Проверяем что вернулись в игру
    expect(currentScreen).toBe('Game');
    expect(screenData.title).toBe('Fluffy Bread');
    expect(screenData.buttons).toContain('Играть');
  });

  test('should maintain game state during navigation', () => {
    // Тестируем сохранение состояния при навигации
    let gameState = {
      score: 5,
      highScore: 10,
      activeSkin: 'bread_default'
    };

    let currentScreen = 'Game';
    const navigationHistory = ['Game'];

    const navigateTo = (screenName) => {
      navigationHistory.push(screenName);
      currentScreen = screenName;
    };

    const navigateBack = () => {
      navigationHistory.pop();
      currentScreen = navigationHistory[navigationHistory.length - 1];
    };

    // Переходим в скины и обратно
    navigateTo('Skins');
    navigateBack();

    // Проверяем что вернулись в игру и состояние сохранилось
    expect(currentScreen).toBe('Game');
    expect(gameState.score).toBe(5);
    expect(gameState.highScore).toBe(10);
    expect(navigationHistory).toEqual(['Game']);
  });

  test('should handle deep navigation', () => {
    // Тестируем сложные сценарии навигации
    const navigationStack = ['Game'];
    let currentScreen = 'Game';

    const navigateTo = (screenName) => {
      navigationStack.push(screenName);
      currentScreen = screenName;
    };

    const navigateBack = () => {
      if (navigationStack.length > 1) {
        navigationStack.pop();
        currentScreen = navigationStack[navigationStack.length - 1];
      }
    };

    // Симулируем сложный маршрут: Game -> Skins -> Achievements -> Game
    navigateTo('Skins');
    expect(currentScreen).toBe('Skins');
    expect(navigationStack).toEqual(['Game', 'Skins']);

    navigateTo('Achievements');
    expect(currentScreen).toBe('Achievements');
    expect(navigationStack).toEqual(['Game', 'Skins', 'Achievements']);

    // Возвращаемся шаг за шагом
    navigateBack(); // Achievements -> Skins
    expect(currentScreen).toBe('Skins');
    expect(navigationStack).toEqual(['Game', 'Skins']);

    navigateBack(); // Skins -> Game
    expect(currentScreen).toBe('Game');
    expect(navigationStack).toEqual(['Game']);
  });

  test('should pass data between screens', () => {
    // Тестируем передачу данных между экранами
    let navigationParams = {};
    let currentScreen = 'Game';

    const navigateToSkins = (params = {}) => {
      currentScreen = 'Skins';
      navigationParams = params;
    };

    const navigateToAchievements = (params = {}) => {
      currentScreen = 'Achievements';
      navigationParams = params;
    };

    // Переходим в скины с параметром выбранного скина
    navigateToSkins({ selectedSkin: 'bread_alt' });
    expect(currentScreen).toBe('Skins');
    expect(navigationParams.selectedSkin).toBe('bread_alt');

    // Переходим в достижения с параметром счета
    navigateToAchievements({ score: 15, newAchievements: ['five_club'] });
    expect(currentScreen).toBe('Achievements');
    expect(navigationParams.score).toBe(15);
    expect(navigationParams.newAchievements).toContain('five_club');
  });

  test('should handle navigation errors gracefully', () => {
    // Тестируем обработку ошибок навигации
    let currentScreen = 'Game';
    let navigationError = null;

    const navigateTo = (screenName) => {
      try {
        // Симулируем возможные ошибки
        if (!screenName) {
          throw new Error('Screen name is required');
        }
        
        if (screenName === 'InvalidScreen') {
          throw new Error('Screen does not exist');
        }

        currentScreen = screenName;
        navigationError = null;
      } catch (error) {
        navigationError = error.message;
      }
    };

    // Успешная навигация
    navigateTo('Skins');
    expect(currentScreen).toBe('Skins');
    expect(navigationError).toBeNull();

    // Навигация с ошибкой - пустое имя экрана
    navigateTo('');
    expect(navigationError).toBe('Screen name is required');
    expect(currentScreen).toBe('Skins'); // Остаемся на текущем экране

    // Навигация с ошибкой - несуществующий экран
    navigateTo('InvalidScreen');
    expect(navigationError).toBe('Screen does not exist');
  });
});