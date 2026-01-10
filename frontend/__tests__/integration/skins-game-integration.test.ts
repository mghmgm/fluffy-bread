describe('Skins + Game Integration', () => {
  test('should use active skin in game logic', async () => {
    let skinSystem = {
      ownedSkins: ['bread_default', 'bread_alt'],
      activeSkin: 'bread_default',
      skinData: {
        'bread_default': { sprite: 'Item_Bread1.png', scale: 1.0 },
        'bread_alt': { sprite: 'Item_Bread.png', scale: 1.0 }
      }
    };

    // Функции работы со скинами
    const setActiveSkin = async (skinId) => {
      if (skinSystem.ownedSkins.includes(skinId)) {
        skinSystem.activeSkin = skinId;
        return true;
      }
      return false;
    };

    const getCurrentSkinData = () => {
      return skinSystem.skinData[skinSystem.activeSkin];
    };

    // Симулируем игровую логику
    let gameState = {
      birdSprite: skinSystem.skinData[skinSystem.activeSkin].sprite,
      score: 0
    };

    // 1. Устанавливаем альтернативный скин
    const success = await setActiveSkin('bread_alt');
    expect(success).toBe(true);
    expect(skinSystem.activeSkin).toBe('bread_alt');

    // 2. Проверяем что игра использует активный скин
    const currentSkinData = getCurrentSkinData();
    gameState.birdSprite = currentSkinData.sprite;
    
    expect(gameState.birdSprite).toBe('Item_Bread.png');
    expect(currentSkinData.sprite).toBe('Item_Bread.png');
  });

  test('should persist skin selection across app restarts', async () => {
    // Симулируем хранилище скинов
    let skinStorage = {
      ownedSkins: ['bread_default', 'bread_alt'],
      selectedSkin: 'bread_default'
    };

    // Первая сессия приложения
    const appSession1 = {
      loadSkins: () => {
        return {
          ownedSkins: skinStorage.ownedSkins,
          activeSkin: skinStorage.selectedSkin || 'bread_default'
        };
      },
      saveSkinSelection: (skinId) => {
        if (skinStorage.ownedSkins.includes(skinId)) {
          skinStorage.selectedSkin = skinId;
          return true;
        }
        return false;
      }
    };

    // Выбираем скин в первой сессии
    const saveSuccess = appSession1.saveSkinSelection('bread_alt');
    expect(saveSuccess).toBe(true);
    expect(skinStorage.selectedSkin).toBe('bread_alt');

    // Симулируем перезапуск приложения (вторая сессия)
    const appSession2 = {
      loadSkins: () => {
        return {
          ownedSkins: skinStorage.ownedSkins,
          activeSkin: skinStorage.selectedSkin || 'bread_default'
        };
      }
    };

    // Загружаем скины во второй сессии
    const skinData = appSession2.loadSkins();
    
    // Проверяем что выбранный скин сохранился
    expect(skinData.activeSkin).toBe('bread_alt');
    expect(skinData.ownedSkins).toContain('bread_alt');
  });

  test('should validate skin ownership before selection', () => {
    // Тестируем валидацию владения скинами
    const skinSystem = {
      ownedSkins: ['bread_default'],
      activeSkin: 'bread_default'
    };

    const setActiveSkin = (skinId) => {
      if (!skinSystem.ownedSkins.includes(skinId)) {
        throw new Error(`Skin ${skinId} is not owned`);
      }
      skinSystem.activeSkin = skinId;
      return true;
    };

    // Успешный выбор доступного скина
    expect(() => setActiveSkin('bread_default')).not.toThrow();
    expect(skinSystem.activeSkin).toBe('bread_default');

    // Попытка выбрать недоступный скин
    expect(() => setActiveSkin('bread_alt')).toThrow('Skin bread_alt is not owned');
    expect(skinSystem.activeSkin).toBe('bread_default'); // Не изменился
  });

  test('should handle skin unlocking during gameplay', () => {
    // Тестируем разблокировку скинов во время игры
    const achievementSystem = {
      unlockedSkins: ['bread_default'],
      checkSkinUnlocks: (score) => {
        const newSkins = [];
        if (score >= 5 && !achievementSystem.unlockedSkins.includes('bread_alt')) {
          newSkins.push('bread_alt');
          achievementSystem.unlockedSkins.push('bread_alt');
        }
        return newSkins;
      }
    };

    const skinSystem = {
      ownedSkins: ['bread_default'],
      activeSkin: 'bread_default'
    };

    // Симулируем игровую сессию с набором очков
    const gameSession = (score) => {
      const newlyUnlockedSkins = achievementSystem.checkSkinUnlocks(score);
      
      // Добавляем новые скины в систему
      newlyUnlockedSkins.forEach(skin => {
        if (!skinSystem.ownedSkins.includes(skin)) {
          skinSystem.ownedSkins.push(skin);
        }
      });

      return newlyUnlockedSkins;
    };

    // Играем с низким счетом - скины не разблокируются
    const result1 = gameSession(3);
    expect(result1).toEqual([]);
    expect(skinSystem.ownedSkins).toEqual(['bread_default']);

    // Играем с высоким счетом - разблокируется новый скин
    const result2 = gameSession(7);
    expect(result2).toEqual(['bread_alt']);
    expect(skinSystem.ownedSkins).toContain('bread_alt');
    expect(achievementSystem.unlockedSkins).toContain('bread_alt');
  });

  test('should sync skin state across multiple game instances', () => {
    // Тестируем синхронизацию состояния скинов между разными частями игры
    const globalSkinState = {
      activeSkin: 'bread_default',
      listeners: []
    };

    // Разные системы игры, которые используют скины
    const gameRenderer = {
      currentSkin: globalSkinState.activeSkin,
      updateSkin: (newSkin) => {
        gameRenderer.currentSkin = newSkin;
      }
    };

    const gameUI = {
      currentSkin: globalSkinState.activeSkin,
      updateSkin: (newSkin) => {
        gameUI.currentSkin = newSkin;
      }
    };

    const skinManager = {
      setActiveSkin: (skinId) => {
        globalSkinState.activeSkin = skinId;
        // Уведомляем все системы об изменении
        gameRenderer.updateSkin(skinId);
        gameUI.updateSkin(skinId);
      }
    };

    // Меняем скин через менеджер
    skinManager.setActiveSkin('bread_alt');

    // Проверяем что все системы синхронизированы
    expect(globalSkinState.activeSkin).toBe('bread_alt');
    expect(gameRenderer.currentSkin).toBe('bread_alt');
    expect(gameUI.currentSkin).toBe('bread_alt');
  });

  test('should handle skin loading errors gracefully', async () => {
    // Тестируем обработку ошибок загрузки скинов
    const skinSystem = {
      ownedSkins: ['bread_default'],
      activeSkin: 'bread_default',
      loadError: null
    };

    const loadSkinAssets = async (skinId) => {
      // Симулируем возможные ошибки загрузки
      if (skinId === 'corrupted_skin') {
        throw new Error('Failed to load skin assets');
      }
      
      if (!skinSystem.ownedSkins.includes(skinId)) {
        throw new Error(`Skin ${skinId} not owned`);
      }

      return { sprite: `${skinId}.png`, loaded: true };
    };

    const setActiveSkinWithErrorHandling = async (skinId) => {
      try {
        const skinAssets = await loadSkinAssets(skinId);
        skinSystem.activeSkin = skinId;
        skinSystem.loadError = null;
        return skinAssets;
      } catch (error) {
        skinSystem.loadError = error.message;
        // Возвращаем к дефолтному скину при ошибке
        skinSystem.activeSkin = 'bread_default';
        return null;
      }
    };

    // Успешная загрузка скина
    const result1 = await setActiveSkinWithErrorHandling('bread_default');
    expect(result1.loaded).toBe(true);
    expect(skinSystem.activeSkin).toBe('bread_default');
    expect(skinSystem.loadError).toBeNull();

    // Ошибка загрузки (скин не принадлежит)
    const result2 = await setActiveSkinWithErrorHandling('unknown_skin');
    expect(result2).toBeNull();
    expect(skinSystem.activeSkin).toBe('bread_default'); // Вернулись к дефолтному
    expect(skinSystem.loadError).toBe('Skin unknown_skin not owned');
  });
});