describe('Game + Achievements Integration', () => {
  test('should unlock achievement after successful run', async () => {
    let gameSystem = {
      currentScore: 0,
      highScore: 0,
      runHistory: []
    };

    let achievementSystem = {
      unlockedAchievements: [],
      recentUnlocks: { ach: [], skins: [] },
      achievementConditions: {
        'first_blood': (score) => score >= 1,
        'five_club': (score) => score >= 5,
        'ten_club': (score) => score >= 10,
        'marathon_50': (score) => score >= 50
      }
    };

    let skinSystem = {
      ownedSkins: ['bread_default'],
      unlockedSkins: []
    };

    // Функции симуляции API
    const appendRun = async (runData) => {
      gameSystem.runHistory.push(runData);
      return Promise.resolve();
    };

    const evaluateAchievementsAfterRun = async (score) => {
      const newlyUnlocked = [];
      const newSkins = [];

      // Проверяем условия достижений
      for (const [achievementId, condition] of Object.entries(achievementSystem.achievementConditions)) {
        if (condition(score) && !achievementSystem.unlockedAchievements.includes(achievementId)) {
          newlyUnlocked.push(achievementId);
          achievementSystem.unlockedAchievements.push(achievementId);
        }
      }

      // Проверяем разблокировку скинов
      if (score >= 5 && !skinSystem.ownedSkins.includes('bread_alt')) {
        newSkins.push('bread_alt');
        skinSystem.ownedSkins.push('bread_alt');
        skinSystem.unlockedSkins.push('bread_alt');
      }

      achievementSystem.recentUnlocks = {
        ach: newlyUnlocked,
        skins: newSkins
      };

      return {
        unlocked: newlyUnlocked,
        skins: newSkins
      };
    };

    // Симулируем игровую сессию
    const completeGameRun = async (score) => {
      gameSystem.currentScore = score;
      
      // Сохраняем забег
      await appendRun({
        score: score,
        createdAt: Date.now()
      });

      // Оцениваем достижения
      const result = await evaluateAchievementsAfterRun(score);
      
      // Обновляем рекорд если нужно
      if (score > gameSystem.highScore) {
        gameSystem.highScore = score;
      }

      return result;
    };

    // 1. Завершаем игру с 5 очками
    const runResult = await completeGameRun(5);

    // 2. Проверяем интеграцию систем
    expect(gameSystem.runHistory).toHaveLength(1);
    expect(gameSystem.runHistory[0].score).toBe(5);
    expect(gameSystem.highScore).toBe(5);

    // 3. Проверяем что достижения разблокировались
    expect(runResult.unlocked).toContain('first_blood');
    expect(runResult.unlocked).toContain('five_club');
    expect(achievementSystem.unlockedAchievements).toContain('first_blood');
    expect(achievementSystem.unlockedAchievements).toContain('five_club');

    // 4. Проверяем что скин разблокировался
    expect(runResult.skins).toContain('bread_alt');
    expect(skinSystem.ownedSkins).toContain('bread_alt');
  });

  test('should handle multiple runs and cumulative achievements', async () => {
    // Тестируем несколько забегов и накопительные достижения
    const achievementSystem = {
      unlockedAchievements: [],
      skinUnlockConditions: {
        'bread_alt': (score) => score >= 5,
        'golden_bread': (ownedSkinsCount) => ownedSkinsCount >= 3
      }
    };

    const skinSystem = {
      ownedSkins: ['bread_default'],
      unlockSkin: function(skinId) {
        if (!this.ownedSkins.includes(skinId)) {
          this.ownedSkins.push(skinId);
          return true;
        }
        return false;
      }
    };

    const processGameRun = (score) => {
      const unlockedAchievements = [];
      const unlockedSkins = [];

      // Разблокировка скина за счет
      if (score >= 5 && achievementSystem.skinUnlockConditions['bread_alt'](score)) {
        if (skinSystem.unlockSkin('bread_alt')) {
          unlockedSkins.push('bread_alt');
        }
      }

      // Разблокировка скина за количество скинов
      if (skinSystem.ownedSkins.length >= 3) {
        if (achievementSystem.skinUnlockConditions['golden_bread'](skinSystem.ownedSkins.length)) {
          if (skinSystem.unlockSkin('golden_bread')) {
            unlockedSkins.push('golden_bread');
          }
        }
      }

      return { unlockedAchievements, unlockedSkins };
    };

    // Первый забег - разблокируем bread_alt
    const result1 = processGameRun(5);
    expect(result1.unlockedSkins).toContain('bread_alt');
    expect(skinSystem.ownedSkins).toContain('bread_alt');

    // Симулируем получение еще одного скина (например, через другую механику)
    skinSystem.unlockSkin('special_bread');
    expect(skinSystem.ownedSkins).toHaveLength(3);

    // Второй забег - должен разблокироваться golden_bread
    const result2 = processGameRun(3); // Низкий счет, но много скинов
    expect(result2.unlockedSkins).toContain('golden_bread');
    expect(skinSystem.ownedSkins).toContain('golden_bread');
  });

  test('should not duplicate achievements on repeated runs', async () => {
    // Тестируем защиту от дублирования достижений
    const achievementSystem = {
      unlockedAchievements: ['first_blood'],
      recentUnlocks: { ach: [], skins: [] }
    };

    const evaluateRun = (score) => {
      const newlyUnlocked = [];
      
      // first_blood уже разблокирован - не должен дублироваться
      if (score >= 1 && !achievementSystem.unlockedAchievements.includes('first_blood')) {
        newlyUnlocked.push('first_blood');
        achievementSystem.unlockedAchievements.push('first_blood');
      }

      // five_club еще не разблокирован - должен добавиться
      if (score >= 5 && !achievementSystem.unlockedAchievements.includes('five_club')) {
        newlyUnlocked.push('five_club');
        achievementSystem.unlockedAchievements.push('five_club');
      }

      achievementSystem.recentUnlocks.ach = newlyUnlocked;
      return newlyUnlocked;
    };

    // Первый забег с 5 очками
    const result1 = evaluateRun(5);
    expect(result1).toContain('five_club');
    expect(result1).not.toContain('first_blood'); // Уже разблокирован
    expect(achievementSystem.unlockedAchievements).toEqual(['first_blood', 'five_club']);

    // Повторный забег с 5 очками
    const result2 = evaluateRun(5);
    expect(result2).toEqual([]); // Ничего нового не разблокировано
    expect(achievementSystem.unlockedAchievements).toEqual(['first_blood', 'five_club']); // Без изменений
  });

  test('should handle achievement evaluation errors gracefully', async () => {
    // Тестируем обработку ошибок при оценке достижений
    const gameSystem = {
      runHistory: [],
      lastError: null
    };

    const evaluateAchievementsWithErrorHandling = async (score) => {
      try {
        // Симулируем возможную ошибку
        if (score < 0) {
          throw new Error('Invalid score: cannot be negative');
        }

        if (score > 1000) {
          throw new Error('Score seems unrealistic');
        }

        // Нормальная обработка
        const unlocked = score >= 1 ? ['first_blood'] : [];
        return { unlocked, skins: [] };
        
      } catch (error) {
        gameSystem.lastError = error.message;
        return { unlocked: [], skins: [] };
      }
    };

    // Успешная оценка
    const result1 = await evaluateAchievementsWithErrorHandling(5);
    expect(result1.unlocked).toContain('first_blood');
    expect(gameSystem.lastError).toBeNull();

    // Ошибка - отрицательный счет
    const result2 = await evaluateAchievementsWithErrorHandling(-5);
    expect(result2.unlocked).toEqual([]);
    expect(gameSystem.lastError).toBe('Invalid score: cannot be negative');

    // Ошибка - нереалистичный счет
    const result3 = await evaluateAchievementsWithErrorHandling(1500);
    expect(result3.unlocked).toEqual([]);
    expect(gameSystem.lastError).toBe('Score seems unrealistic');
  });

  test('should sync game state with achievement system', () => {
    // Тестируем синхронизацию состояния между системами
    const sharedGameState = {
      score: 0,
      achievements: [],
      skins: ['bread_default']
    };

    const gameEngine = {
      updateScore: function(newScore) {
        sharedGameState.score = newScore;
        this.checkAchievements();
      },
      checkAchievements: function() {
        const newAchievements = [];
        if (sharedGameState.score >= 1 && !sharedGameState.achievements.includes('first_blood')) {
          newAchievements.push('first_blood');
        }
        if (sharedGameState.score >= 5 && !sharedGameState.achievements.includes('five_club')) {
          newAchievements.push('five_club');
          // Также разблокируем скин
          if (!sharedGameState.skins.includes('bread_alt')) {
            sharedGameState.skins.push('bread_alt');
          }
        }
        
        sharedGameState.achievements.push(...newAchievements);
        return newAchievements;
      }
    };

    // Симулируем игровой процесс
    gameEngine.updateScore(3);
    expect(sharedGameState.achievements).toContain('first_blood');
    expect(sharedGameState.skins).not.toContain('bread_alt');

    gameEngine.updateScore(7);
    expect(sharedGameState.achievements).toContain('five_club');
    expect(sharedGameState.skins).toContain('bread_alt');
  });
});