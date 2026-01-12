import { Canvas, Group, Image, useImage } from '@shopify/react-native-skia';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getToken, api } from '../services/apiClient';
import {
  Text as RNText,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Alert,
  Modal,
  TextInput,
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
import { useAuth } from '../hooks/useAuth';
import { useSkins } from '../hooks/useSkins';
import { appendRun } from '../services/gameApi';
import { playTapSound, initTapSound, disposeTapSound } from '../hooks/useTapSound';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useAudioSettings } from '@/hooks/useAudioSettings';

const DEFAULT_GRAVITY = 1000;
const DEFAULT_JUMP_FORCE = -500;
const pipeWidth = 104;
const pipeHeight = 640;
const baseHeight = 150;

const App = () => {
  const { user, loading: authLoading, refresh: refreshAuth } = useAuth();

  

  useFocusEffect(
    useCallback(() => {
      refreshAuth();
    }, []),
  );

  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [score, setScore] = useState(0);
  const { config, highScore, resourceError, updateHighScore } = useGameResources();
  const [gameState, setGameState] = useState<
    'menu' | 'playing' | 'gameover' | 'skins' | 'achievements'
  >('menu');
  const { ownedSkins, activeSkin, setActiveSkin, refreshOwned } = useSkins();
  const { state: achievementsState, recentUnlocks, evaluateAfterRun } = useAchievements();

  const { musicVolume } = useAudioSettings();
  const { sfxVolume } = useAudioSettings();
  useBackgroundMusic(gameState === 'menu', musicVolume);

  // Profile editor state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [updatingUsername, setUpdatingUsername] = useState(false);

  const bg = useImage(require('../assets/sprites/background-day.png'));
  const birdDefault = useImage(require('../assets/sprites/Item_Bread1.png'));
  const birdAlt = useImage(require('../assets/sprites/Item_Bread.png'));
  const pipeBottom = useImage(require('../assets/sprites/pipe-green.png'));
  const pipeTop = useImage(require('../assets/sprites/pipe-green-top.png'));
  const base = useImage(require('../assets/sprites/base.png'));

  const menuClickSound = '../assets/sounds/clickMenuSound.mp3';
  const onBreadTap = '../assets/sounds/onBreadTap.mp3';

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

  // Profile management functions
  const handleUpdateUsername = useCallback(async () => {
    if (!editUsername.trim()) {
      Alert.alert('Ошибка', 'Имя не может быть пустым');
      return;
    }

    if (editUsername === user?.username) {
      setShowProfileModal(false);
      return;
    }

    try {
      setUpdatingUsername(true);
      await api.updateUsername(editUsername);
      refreshAuth();
      setShowProfileModal(false);
      Alert.alert('Успех', 'Имя успешно обновлено');
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Ошибка обновления имени');
      setEditUsername(user?.username || '');
    } finally {
      setUpdatingUsername(false);
    }
  }, [editUsername, user?.username, refreshAuth]);

  const handleDeleteProgress = useCallback(() => {
    Alert.alert(
      'Удалить прогресс',
      'Это действие удалит все ваши игровые записи. Это нельзя отменить.',
      [
        { text: 'Отмена', onPress: () => {}, style: 'cancel' },
        {
          text: 'Удалить',
          onPress: async () => {
            try {
              await api.deleteProgress();
              updateHighScore(0);
              Alert.alert('Успех', 'Прогресс удален');
            } catch (error) {
              Alert.alert(
                'Ошибка',
                error instanceof Error ? error.message : 'Ошибка удаления прогресса',
              );
            }
          },
          style: 'destructive',
        },
      ],
    );
  }, [updateHighScore]);

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

  useEffect(() => {
    void initTapSound();
    return () => {
      void disposeTapSound();
    };
  }, []);

  // ВАЖНО: Этот useAnimatedReaction из старой версии отвечает за респавн труб и подсчет очков
  useAnimatedReaction(
    () => pipeX.value,
    (currentValue, previousValue) => {
      const middle = birdX;

      // Респавн труб когда они уходят за экран
      if (previousValue && currentValue < -100 && previousValue > -100) {
        const maxOffset = (height - baseHeight - pipeGap.value) / 2;
        const randomOffset = maxOffset <= 0 ? 0 : (Math.random() - 0.5) * maxOffset;
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
    },
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
    runOnJS(playTapSound)(sfxVolume);
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
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => router.push('/settings')}
                >
                  <RNText style={styles.secondaryButtonText}>Настройки</RNText>
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

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <RNText style={styles.modalTitle}>Редактировать профиль</RNText>

            <View style={styles.formGroup}>
              <RNText style={styles.label}>Имя пользователя</RNText>
              <TextInput
                style={styles.input}
                placeholder="Введите новое имя"
                value={editUsername}
                onChangeText={setEditUsername}
                editable={!updatingUsername}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.primaryButton, updatingUsername && styles.disabledButton]}
                onPress={handleUpdateUsername}
                disabled={updatingUsername}
              >
                <RNText style={styles.primaryButtonText}>
                  {updatingUsername ? 'Сохранение...' : 'Сохранить'}
                </RNText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowProfileModal(false)}
                disabled={updatingUsername}
              >
                <RNText style={styles.secondaryButtonText}>Отмена</RNText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  hudBest: {
    fontSize: 16,
    color: '#ffe4ad',
  },
  // ========== ДОБАВЬТЕ ЭТО ==========
  authBlock: {
    backgroundColor: 'rgba(255, 244, 220, 0.3)',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    marginBottom: 12,
    width: '100%',
    maxWidth: 300,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff4dc',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 244, 220, 0.5)',
    borderRadius: 12,
    padding: 10,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3d2c1f',
    textAlign: 'center',
  },
  authButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  profileButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  deleteButton: {
    backgroundColor: '#e63946',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff4dc',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3d2c1f',
    marginBottom: 12,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3d2c1f',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#d4a574',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#3d2c1f',
  },
  modalButtonsContainer: {
    gap: 12,
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
export default App;
