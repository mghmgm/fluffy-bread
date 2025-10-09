import { Canvas, Group, Image, useImage } from '@shopify/react-native-skia';
import { useCallback, useEffect, useState } from 'react';
import {
  Text as RNText,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useRouter } from 'expo-router';
import { useAchievements } from '../hooks/useAchievements';
import { useGameResources } from '../hooks/useGameResources';
import { useSkins } from '../hooks/useSkins';
import { appendRun } from '../services/gameApi';

const DEFAULT_GRAVITY = 1000;
const DEFAULT_JUMP_FORCE = -500;

const pipeWidth = 104;
const pipeHeight = 640;
const baseHeight = 150;

const App = () => {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [score, setScore] = useState(0);
  const { config, highScore, resourceError, updateHighScore } = useGameResources();
  const [gameState, setGameState] = useState<
    'menu' | 'playing' | 'gameover' | 'skins' | 'achievements'
  >('menu');
  const { ownedSkins, activeSkin, setActiveSkin, refreshOwned } = useSkins();
  const { state: achievementsState, recentUnlocks, evaluateAfterRun } = useAchievements();

  const bg = useImage(require('../assets/sprites/background-day.png'));
  const birdDefault = useImage(require('../assets/sprites/Item_Bread1.png'));
  const birdAlt = useImage(require('../assets/sprites/Item_Bread.png'));
  const pipeBottom = useImage(require('../assets/sprites/pipe-green.png'));
  const pipeTop = useImage(require('../assets/sprites/pipe-green-top.png'));
  const base = useImage(require('../assets/sprites/base.png'));

  const gravity = useSharedValue(DEFAULT_GRAVITY);
  const jumpForce = useSharedValue(DEFAULT_JUMP_FORCE);
  const pipeGap = useSharedValue(config.pipeGap);
  const speedMultiplier = useSharedValue(1);
  const scoreValue = useSharedValue(0);
  const gameOver = useSharedValue(false);
  const isPlaying = useSharedValue(false);
  const pipeX = useSharedValue(width);

  const birdY = useSharedValue(height / 3);
  const birdX = width / 4;
  const birdYVelocity = useSharedValue(0);

  const pipeOffset = useSharedValue(0);
  const topPipeY = useDerivedValue(() => {
    const centerY = height / 2 + pipeOffset.value;
    return centerY - pipeGap.value / 2 - pipeHeight;
  });
  const bottomPipeY = useDerivedValue(() => {
    const centerY = height / 2 + pipeOffset.value;
    return centerY + pipeGap.value / 2;
  });

  const pipesSpeed = useDerivedValue(() => {
    return interpolate(scoreValue.value, [0, 20], [1, 2]) * speedMultiplier.value;
  });

  // Исправлено: добавлена улучшенная проверка столкновений
  const isBirdCollidingWithRect = (
    bird: { x: number; y: number; width: number; height: number },
    rect: { x: number; y: number; w: number; h: number },
  ) => {
    'worklet';
    return (
      bird.x < rect.x + rect.w &&
      bird.x + bird.width > rect.x &&
      bird.y < rect.y + rect.h &&
      bird.y + bird.height > rect.y
    );
  };

  const incrementScore = useCallback(() => {
    setScore((prev) => prev + 1);
  }, []);

  const resetScore = useCallback(() => {
    setScore(0);
  }, []);

  const obstacles = useDerivedValue(() => [
    // bottom pipe
    {
      x: pipeX.value,
      y: bottomPipeY.value,
      h: pipeHeight,
      w: pipeWidth,
    },
    // top pipe
    {
      x: pipeX.value,
      y: topPipeY.value,
      h: pipeHeight,
      w: pipeWidth,
    },
  ]);

  const moveTheMap = useCallback(() => {
    if (!isPlaying.value) {
      return;
    }
    pipeX.value = withSequence(
      withTiming(width, { duration: 0 }),
      withTiming(-150, {
        duration: 3000 / Math.max(pipesSpeed.value, 0.5),
        easing: Easing.linear,
      }),
      withTiming(width, { duration: 0 }),
    );
  }, [isPlaying, pipeX, pipesSpeed, width]);

  const prepareRun = useCallback(() => {
    birdY.value = height / 3;
    birdYVelocity.value = 0;
    pipeX.value = width;
    pipeOffset.value = 0;
    scoreValue.value = 0;
  }, [birdY, birdYVelocity, height, pipeOffset, pipeX, scoreValue, width]);

  const startRun = useCallback(() => {
    prepareRun();
    resetScore();
    isPlaying.value = true;
    gameOver.value = false;
    setGameState('playing');
    moveTheMap();
  }, [gameOver, isPlaying, moveTheMap, prepareRun, resetScore]);

  const returnToMenu = useCallback(() => {
    prepareRun();
    resetScore();
    isPlaying.value = false;
    gameOver.value = false;
    cancelAnimation(pipeX);
    setGameState('menu');
  }, [gameOver, isPlaying, pipeX, prepareRun, resetScore]);

  const handleGameOver = useCallback(() => {
    cancelAnimation(pipeX);
    isPlaying.value = false;
    runOnJS(() => {
      setGameState('gameover');
    })();
  }, [isPlaying, pipeX]);

  useEffect(() => {
    gravity.value = config.gravity;
    jumpForce.value = config.jumpForce;
    pipeGap.value = config.pipeGap;
    speedMultiplier.value = config.speedMultiplier;
    pipeOffset.value = 0;
  }, [config, gravity, jumpForce, pipeGap, pipeOffset, speedMultiplier]);

  // КРИТИЧЕСКИ ВАЖНО: Этот useEffect управляет движением труб при смене состояния игры
  useEffect(() => {
    if (gameState === 'playing') {
      isPlaying.value = true;
      gameOver.value = false;
      moveTheMap();
    } else if (gameState === 'gameover') {
      isPlaying.value = false;
      gameOver.value = true;
      cancelAnimation(pipeX);
    } else {
      isPlaying.value = false;
      gameOver.value = false;
      cancelAnimation(pipeX);
    }
  }, [gameOver, gameState, isPlaying, moveTheMap, pipeX]);

  useEffect(() => {
    scoreValue.value = score;
  }, [score, scoreValue]);

  useEffect(() => {
    if (score > highScore) {
      void updateHighScore(score);
    }
  }, [highScore, score, updateHighScore]);

  // ВАЖНО: Этот useAnimatedReaction из старой версии отвечает за респавн труб и подсчет очков
  useAnimatedReaction(
    () => pipeX.value,
    (currentValue, previousValue) => {
      const middle = birdX;

      // Респавн труб когда они уходят за экран
      if (previousValue && currentValue < -100 && previousValue > -100) {
        const maxOffset = (height - baseHeight - pipeGap.value) / 2;
        const randomOffset =
          maxOffset <= 0 ? 0 : (Math.random() - 0.5) * maxOffset;
        pipeOffset.value = randomOffset;
        cancelAnimation(pipeX);
        runOnJS(moveTheMap)();
      }

      // Подсчет очков когда птица проходит трубу
      if (
        currentValue !== previousValue &&
        previousValue &&
        currentValue <= middle &&
        previousValue > middle
      ) {
        scoreValue.value = scoreValue.value + 1;
        runOnJS(incrementScore)();
      }
    }
  );

  // Исправлено: оставлена только одна проверка столкновений (прямоугольная)
  useAnimatedReaction(
    () => birdY.value,
    (currentValue, previousValue) => {
      const birdRect = {
        x: birdX,
        y: birdY.value,
        width: 64,
        height: 48,
      };

      // Проверка столкновения с полом или потолком
      if (currentValue > height - baseHeight || currentValue < 0) {
        gameOver.value = true;
      }

      // Проверка столкновения с трубами
      const isColliding = obstacles.value.some((rect) => isBirdCollidingWithRect(birdRect, rect));
      if (isColliding) {
        gameOver.value = true;
      }
    },
  );

  useAnimatedReaction(
    () => gameOver.value,
    (currentValue, previousValue) => {
      if (currentValue && !previousValue) {
        cancelAnimation(pipeX);
        runOnJS(handleGameOver)();
      }
    },
  );

  // Выполняем пост-обработку забега в обычном JS-потоке
  useEffect(() => {
    if (gameState !== 'gameover') return;
    let cancelled = false;
    const processGameOver = async () => {
      try {
        await appendRun({ score, createdAt: Date.now() });
        if (cancelled) return;

        const res = await evaluateAfterRun(score);
        if (cancelled) return;

        if (res.skins.length > 0) {
          await refreshOwned();
        }
      } catch (error) {
        console.warn('Game over processing error:', error);
      }
    };

    processGameOver();

    return () => {
      cancelled = true;
    };
  }, [gameState, score, evaluateAfterRun, refreshOwned]);

  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    if (!dt || !isPlaying.value || gameOver.value) {
      return;
    }
    birdY.value = birdY.value + (birdYVelocity.value * dt) / 1000;
    birdYVelocity.value = birdYVelocity.value + (gravity.value * dt) / 1000;
  });

  const gesture = Gesture.Tap().onStart(() => {
    'worklet';
    if (!isPlaying.value || gameOver.value) {
      return;
    }
    birdYVelocity.value = jumpForce.value;
  });

  const birdTransform = useDerivedValue(() => {
    return [
      {
        rotate: interpolate(birdYVelocity.value, [-500, 500], [-0.5, 0.5], Extrapolation.CLAMP),
      },
    ];
  });
  const birdOrigin = useDerivedValue(() => {
    return { x: width / 4 + 32, y: birdY.value + 24 };
  });

  return (
    <GestureHandlerRootView style={styles.root}>
      <GestureDetector gesture={gesture}>
        <View style={styles.root}>
          <Canvas style={[styles.canvas, { width, height }]}>
            {/* Фон */}
            <Image image={bg} width={width} height={height} fit={'cover'} />

            {/* Трубы */}
            <Image image={pipeTop} y={topPipeY} x={pipeX} width={pipeWidth} height={pipeHeight} />
            <Image
              image={pipeBottom}
              y={bottomPipeY}
              x={pipeX}
              width={pipeWidth}
              height={pipeHeight}
            />

            {/* Пол */}
            <Image
              image={base}
              width={width}
              height={baseHeight}
              y={height - baseHeight / 2}
              x={0}
              fit={'cover'}
            />

            {/* Птица (хлеб) */}
            <Group transform={birdTransform} origin={birdOrigin}>
              <Image
                image={activeSkin === 'bread_alt' ? birdAlt : birdDefault}
                y={birdY}
                x={birdX}
                width={64}
                height={48}
              />
            </Group>
          </Canvas>
          {gameState === 'playing' ? (
            <View style={styles.hud} pointerEvents="none">
              <RNText style={styles.hudScore}>{score}</RNText>
              <RNText style={styles.hudBest}>Лучший: {highScore}</RNText>
            </View>
          ) : null}

          {gameState === 'menu' ? (
            <View style={styles.overlay}>
              <RNText style={styles.title}>Fluffy Bread</RNText>
              <RNText style={styles.subtitle}>Тапните хлеб, чтобы взлететь</RNText>
              <RNText style={styles.tip}>{config.tip}</RNText>
              {resourceError ? (
                <RNText style={styles.tip}>Оффлайн режим: {resourceError}</RNText>
              ) : null}
              <View style={styles.actionsColumn}>
                <TouchableOpacity style={styles.primaryButton} onPress={startRun}>
                  <RNText style={styles.primaryButtonText}>Играть</RNText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => router.push('/skins')}
                >
                  <RNText style={styles.secondaryButtonText}>Скины</RNText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => router.push('/achievements')}
                >
                  <RNText style={styles.secondaryButtonText}>Достижения</RNText>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {gameState === 'gameover' ? (
            <View style={styles.overlay}>
              <RNText style={styles.title}>Конец игры</RNText>
              <RNText style={styles.subtitle}>Счёт: {score}</RNText>
              <RNText style={styles.subtitle}>Рекорд: {highScore}</RNText>
              <RNText style={styles.tip}>{config.tip}</RNText>
              {recentUnlocks.ach.length > 0 || recentUnlocks.skins.length > 0 ? (
                <View style={{ alignItems: 'center', gap: 6 }}>
                  {recentUnlocks.ach.length > 0 ? (
                    <RNText style={styles.tip}>
                      Новые достижения: {recentUnlocks.ach.join(', ')}
                    </RNText>
                  ) : null}
                  {recentUnlocks.skins.length > 0 ? (
                    <RNText style={styles.tip}>
                      Новые скины: {recentUnlocks.skins.join(', ')}
                    </RNText>
                  ) : null}
                </View>
              ) : null}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.primaryButton} onPress={startRun}>
                  <RNText style={styles.primaryButtonText}>Сыграть ещё</RNText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={returnToMenu}>
                  <RNText style={styles.secondaryButtonText}>Меню</RNText>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  canvas: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  actionsColumn: {
    gap: 10,
    alignItems: 'center',
  },
  achList: {
    width: '100%',
    maxWidth: 420,
    gap: 8,
  },
  achItem: {
    backgroundColor: 'rgba(255, 244, 220, 0.6)',
    borderRadius: 12,
    padding: 12,
  },
  achItemUnlocked: {
    backgroundColor: 'rgba(188, 230, 192, 0.7)',
  },
  achName: {
    color: '#3d2c1f',
    fontWeight: '700',
    fontSize: 16,
  },
  achDesc: {
    color: '#3d2c1f',
    opacity: 0.9,
  },
  achStatus: {
    marginTop: 4,
    color: '#3d2c1f',
    fontWeight: '600',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff4dc',
    textShadowColor: '#3d2c1f',
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffe4ad',
  },
  tip: {
    fontSize: 16,
    color: '#fff4dc',
    textAlign: 'center',
  },
  primaryButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: '#f1c27d',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3d2c1f',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 244, 220, 0.7)',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3d2c1f',
  },
  hud: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 4,
  },
  hudScore: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff4dc',
    textShadowColor: '#3d2c1f',
    textShadowRadius: 6,
  },
  hudBest: {
    fontSize: 16,
    color: '#ffe4ad',
  },
});
export default App;